import * as R from "ramda";
import * as Discord from "discord.js";
import { DateTime } from "luxon";
import schedule from "node-schedule";

import { channels } from "../../deprecating/channels";
import { roles } from "../../deprecating/roles";
import { logger } from "../../logger";
import { MemberList } from "../../deprecating/MemberList";
import { runWithContext } from "../../deprecating/log";

import * as Workout from "./Workout";
import * as User from "./User";
import * as Exp from "./Exp";
import * as Week from "./Week";
import * as Rank from "./Rank";

const MINIMUM_EXP_FOR_PROMOTION = 150;
const MAX_FITSCORE = 100;

const log = logger ("fit:promotions");

/** Utility for keeping track of user's diff */
type UserPromoter = {
  // Reference to the user, up to date with the latest fitScore
  user: User.authorized;
  // Which direction the fit score changed and by how much
  change: number;

  // Increase / decrease the user's fitScore
  promote: (workouts: Workout.workout[]) => void;
};


const UserPromoter = (user: User.authorized) : UserPromoter => {
   let draft: User.authorized = { ...user };

   return {
      get user() {
         return draft;
      },

      get change() {
         return draft.fitScore - user.fitScore;
      },

      promote: workouts => {
         const exp = workouts.map (w => Exp.total (w.exp)).reduce ((a, b) => a + b, 0);
         let score = draft.fitScore;

         if (exp >= MINIMUM_EXP_FOR_PROMOTION) {
            score = user.fitScore + 5;
         }
         else {
            const missedBy = 1 - (exp / MINIMUM_EXP_FOR_PROMOTION);
            score -= missedBy * 5;
         }

         draft = {
            ...draft,
            fitScore: R.clamp (0, MAX_FITSCORE, score)
         };
      }
   };
};

const fetchStravaChannel = async (client: Discord.Client) => {
   const channel = await client.channels.fetch (channels.strava);

   if (!channel?.isTextBased ()) {
      throw new Error ("Could not find channel or channel is not a text channel");
   }

   return channel;
};

/**
 * Set the role the user has been awarded.
 * User can only have 1 role at a time, so we'll remove the others
 */
const updateRoles = (member: Discord.GuildMember, roleId: string) : Promise<void[]> => 
   Promise.all (
      [roles.certified_swole, roles.max_effort, roles.break_a_sweat]
         .map (async role => {
            if (role === roleId && member.roles.cache.has (role)) {
               await member.roles.add (role);
            }
            else if (role !== roleId && member.roles.cache.has (role)) {
               await member.roles.remove (role);
            }
         })
   );

/**
 * Once a week we tally up how much exp a user's gained in a week,
 * and either increase or decrease their `fitScore`
 * then post everyone's promotion status
 * 
 * If they reach `MINIMUM_EXP_FOR_PROMOTION` they will go up 5points,
 * and if they don't reach it then they lose 0-5 fit score based on how much they gained
 */
export const runPromotions = async (client: Discord.Client) : Promise<void> => {
   const lastWeek = Week.previous ();

   log.debug ("Fetching promotions", { week: lastWeek.toString () });

   const [users, allWorkouts] = await Promise.all ([
      User.find ()
         .then (u => u.filter (User.isAuthorized)),

      Workout.find (Workout.during (lastWeek))
   ]);

   const promoters = users.map (UserPromoter);

   log.debug ("Fetching all members and channel from discord");

   const [members, channel] = await Promise.all ([
      MemberList.fetch (client, promoters.map (p => p.user.discordId)),
      fetchStravaChannel (client)
   ]);

   log.debug ("Begin promoting users", { promoters: promoters.length, workouts: allWorkouts.length });
  
   // Promote everyone based on their workouts for the week
   // and save it to the database
   await Promise.all (
      promoters.map (async promoter => {
         const workouts = allWorkouts.filter (Workout.belongsTo (promoter.user));
         promoter.promote (workouts);

         log.debug ("Updating User", { discordId: promoter.user.discordId, nickname: members.nickname (promoter.user.discordId) });
         await User.update (promoter.user);

         const userRole = 
        (promoter.user.fitScore >= 100)   ? roles.certified_swole
           : (promoter.user.fitScore >= 80)  ? roles.max_effort
              : (promoter.user.fitScore >= 60)  ? roles.break_a_sweat
                 : "";

         members.get (promoter.user.discordId)
            .map (m => updateRoles (m, userRole));
      })
   );

   // Format each result type into a row 
   // that we'll display all one after another in an embed
   const rows = promoters
      .filter (p => !(p.user.fitScore === 0 && p.change === 0))
      .sort ((a, b) => a.user.fitScore > b.user.fitScore ? -1 : 1)
      .map (({ user, change }: UserPromoter) : string => {
      // get up or down doot emoji
         const emoji = 
        (user.fitScore === 100 && change === 0) ? "🔹" 
           : (user.fitScore === 100 && change > 0) ? "🎉"
              : (change > 0)  ? "⬆️" 
                 : (user.fitScore === 0 && change < 0) ? "🥺"
                    : "🔻";
          
         const rank = Rank.fromScore (user.fitScore);
         const nickname = members.nickname (user.discordId);
      
         // add a plus sign if change is positive
         const diff = (change < 0) ? `(${change.toFixed (1)})` : "";

         return `${emoji} **${rank}** ${nickname} ${diff}`;
      });


   // Since there's a character limit to embed, 
   // we need to split the results into multiple embeds (chunks)
   // 20 is just a random number that fits under the limit
   const chunkSize = 20;

   const embeds : Discord.APIEmbed[] = [];

   for (let i = 0; i < rows.length; i += chunkSize) {
      embeds.push (
         new Discord.EmbedBuilder ({
            color:  0xffd700,
            footer: { text: lastWeek.toFormat ("MMM dd") },
            fields: [{
               name:  "Promotions",
               value: rows.slice (i, i + chunkSize).join ("\n")
            }]
         }).toJSON ()
      );
   }

   log.debug ("Sending promotion embeds", { count: embeds.length });
   await channel.send ({ embeds });
};

export const startSchedule = (client: Discord.Client) : void => {
   // The time when the weekly update gets posted
   const weekly_post_time = DateTime
      .local ()
      .set ({ weekday: 1, hour: 8, minute: 0, second: 0 })
      .toLocal ();

   schedule.scheduleJob ({
      dayOfWeek: weekly_post_time.weekday,
      hour:      weekly_post_time.hour,
      minute:    weekly_post_time.minute,
      second:    weekly_post_time.second
   }, () => { 
      runWithContext (() => {
         log.info ("Begin promoting on schedule");
         runPromotions (client); 
      });
   });
};