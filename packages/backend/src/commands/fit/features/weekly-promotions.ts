import * as R from 'ramda';
import { MessageEmbed } from 'discord.js';
import { DateTime } from 'luxon';
import schedule from 'node-schedule';

import { Instance, Member } from '@sjbha/app';
import { channels, roles } from '@sjbha/config';

import { Workout, Workouts, sumExp, belongsTo } from '../db/workout';
import * as User from '../db/user';
import { previousWeek } from '../common/week';
import { MemberList } from '../common/MemberList';
import { getRank } from '../common/ranks';

const MINIMUM_EXP_FOR_PROMOTION = 150;
const MAX_FITSCORE = 100;

/** The time when the weekly update gets posted */
const weekly_post_time = DateTime
  .local ()
  .set ({ weekday: 1, hour: 8, minute: 0, second: 0 })
  .toLocal ();

schedule.scheduleJob ({
  dayOfWeek: weekly_post_time.weekday,
  hour:      weekly_post_time.hour,
  minute:    weekly_post_time.minute,
  second:    weekly_post_time.second
}, () => { runPromotions () });

/**
 * Once a week we tally up how much exp a user's gained in a week,
 * and either increase or decrease their `fitScore`
 * then post everyone's promotion status
 * 
 * If they reach `MINIMUM_EXP_FOR_PROMOTION` they will go up 5points,
 * and if they don't reach it then they lose 0-5 fit score based on how much they gained
 */
export const runPromotions = async () : Promise<void> => {
  const lastWeek = previousWeek ();

  const [users, allWorkouts] = await Promise.all ([
    User.find ()
      .then (u => u.filter (User.isAuthorized)),

    Workouts ()
      .during (lastWeek)
      .find ()
  ]);

  const promoters = users.map (UserPromoter);

  const [members, channel] = await Promise.all ([
    MemberList.fetch (promoters.map (p => p.user.discordId)),
    Instance.fetchChannel (channels.strava)
  ]);

  console.log (`Promoting ${promoters.length} users who recorded ${allWorkouts.length} workouts`);  


  // Promote everyone based on their workouts for the week
  // and save it to the database
  await Promise.all (
    promoters.map (async promoter => {
      const workouts = allWorkouts.filter (belongsTo (promoter.user));
      promoter.promote (workouts);

      await User.update (promoter.user);

      const userRole = 
        (promoter.user.fitScore >= 100)   ? roles.certified_swole
        : (promoter.user.fitScore >= 80)  ? roles.max_effort
        : (promoter.user.fitScore >= 60)  ? roles.break_a_sweat
        : '';

      await members.get (promoter.user.discordId)
        .map (m => setFitRole (m, userRole))
        .orDefault (Promise.resolve (false));
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
        (user.fitScore === 100 && change === 0) ? '🔹' 
        : (user.fitScore === 100 && change > 0) ? '🎉'
        : (change > 0)  ? '⬆️' 
        : (user.fitScore === 0 && change < 0) ? '🥺'
        : '🔻';
          
      const rank = getRank (user.fitScore);
      const nickname = members.nickname (user.discordId);
      
      // add a plus sign if change is positive
      const diff = (change < 0) ? `(${change.toFixed (1)})` : '';

      return `${emoji} **${rank}** ${nickname} ${diff}`;
    });


  // Since there's a character limit to embed, 
  // we need to split the results into multiple embeds (chunks)
  // 20 is just a random number that fits under the limit
  const chunkSize = 20;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const embed = new MessageEmbed ({
      color:  0xffd700,
      footer: { text: lastWeek.toFormat ('MMM dd') },
      fields: [{
        name:  'Promotions',
        value: rows.slice (i, i + chunkSize).join ('\n')
      }]
    });

    await channel.send (embed);
  }
}

/** Utility for keeping track of user's diff */
type UserPromoter = {

  /** Reference to the user, up to date with the latest fitScore */
  user: User.Authorized;

  /** Which direction the fit score changed and by how much */
  change: number;

  /** Increase / decrease the user's fitScore */
  promote: (workouts: Workout.Model[]) => void;
};

const UserPromoter = (user: User.Authorized) : UserPromoter => {
  let draft: User.Authorized = { ...user };

  return {
    get user() {
      return draft;
    },

    get change() {
      return draft.fitScore - user.fitScore;
    },

    promote: workouts => {
      const exp = sumExp (workouts);
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
  }
};


/**
 * Set the role the user has been awarded.
 * User can only have 1 role at a time, so we'll remove the others
 */
const setFitRole = (member: Member, roleId: string) : Promise<boolean> => 
  Promise.all ([
    roles.certified_swole, 
    roles.max_effort, 
    roles.break_a_sweat
  ].map (role => (role === roleId)
    ? member.roles.add (role)
    : member.roles.remove (role)
  )).then (_ => true);