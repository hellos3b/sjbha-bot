import { DateTime } from "luxon";
import * as DiscordJs from "discord.js";

import { logger } from "../../logger";
import { channels } from "../../deprecating/channels";
import * as Guild from "../../deprecating/Guild";

import * as Activity from "./Activity";
import * as StravaAPI from "./StravaAPI";
import * as User from "./User";
import * as Workout from "./Workout";
import * as Week from "./Week";
import * as Exp from "./Exp";
import * as Format from "./Format";
import { isAfter, subDays } from "date-fns";

const log = logger ("fit:workout-embed");
const defaultAvatar = "https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png";

const getStravaChannel = async (client: DiscordJs.Client): Promise<DiscordJs.TextBasedChannel> => {
   const channel = await client.channels.fetch (channels.strava);
   if (channel?.type !== DiscordJs.ChannelType.GuildText)
      throw new Error ("Failed to find fitness channel");

   return channel;
};

// A simple way to represent moderate vs vigorous exp data
const gained = ({ exp }: Workout.workout) => {
   const total = Exp.total (exp);
   if (exp.type === "hr")
      return `${Format.exp (exp.moderate)}+ ${Format.exp (exp.vigorous)}++`;
   else
      return `${Format.exp (total)}+`;
};

const heartstats = (activity: Activity.activity) => {
   const hr = Activity.heartRate (activity);
   return (hr)
      ? `hr ${hr.max} max ${hr.average} avg | `
      : "";
};

// Different activities have different activity stats that are worth showing.
// We'll figure out which ones to show here, otherwise default to heartrate stats (if available)
const activityText = (activity: Activity.activity): string => {
   const { type } = Activity;

   const power = Activity.power (activity);
   const workoutType = Activity.workoutType (activity);

   // data fields
   const elapsed = Format.duration (activity.elapsed_time);
   const distance = activity.distance > 0 ? Format.miles (activity.distance) : ""; 
   const elevation = activity.total_elevation_gain > 0 ? Format.feet (activity.total_elevation_gain) : "";
   const pace = Format.pace (activity.average_speed) + "/mi"; 
   const avgWatts = power ? Format.power (power.average) : "";

   switch (activity.type) {
      case type.Ride:
         if (workoutType === "workout") {
            if (avgWatts)
               return `did a bike workout averaging ${avgWatts} for ${elapsed}`;
            return `did a bike workout for ${elapsed}`;
         }
         if (distance) {
            const msg = `rode their bike ${distance} in ${elapsed}`;
            if (avgWatts)
               return msg + ` and averaged ${avgWatts}`;
            if (elevation)
               return msg + `, climbing ${elevation}`;
            return msg;
         }
         return `rode their bike for ${elapsed}`;

      case type.Run:
         if (workoutType === "workout") {
            return `did a ${elapsed} running working`;
         }
         if (distance && pace)
            return `ran ${distance} in ${elapsed} (avg pace ${pace})`;
         if (distance)
            return `ran ${distance} in ${elapsed}`;
         return `ran for ${elapsed}`;

      case type.Hike:
         if (distance && elevation)
            return `hiked ${distance} up ${elevation} in ${elapsed}`;
         if (distance)
            return `hiked ${distance} in ${elapsed}`;
         return `hiked for ${elapsed}`;

      case type.VirtualRide:
         return `did a virtual ride for ${elapsed}`;
         
      case type.Walk:
         return (distance)
            ? `walked ${distance} in ${elapsed}`
            : `walked for ${elapsed}`;

      case type.WeightTraining:
         return `lifted weights for ${elapsed}`;

      case type.Yoga:
         return `did yoga for ${elapsed}`;

      case type.Crossfit:
         return `did crossfit for ${elapsed}`;

      case type.RockClimbing:
         return `went rock climbing for ${elapsed}`;

      default:
         return `worked out for ${elapsed}`;
   }
};

export const expSoFar = (workout: Workout.workout, workouts: Workout.workout[]): number => {
   const previousExp = workouts
      .filter (w => w.timestamp < workout.timestamp)
      .filter (w => w.activity_id !== workout.activity_id)
      .map (w => w.exp);

   return Exp.sum (previousExp) + Exp.total (workout.exp);
};

// We won't post workouts from users who have gone inactive.
const inactive = (user: User.authorized) => {
   // starting this, we'll filter out feedback after x days
   const featStart = new Date("2023-10-21T00:04:53.555Z");
   if (!isAfter(new Date(), featStart)) return false;

   const lastActive = new Date(user.lastActive || 0);
   const limit = subDays(new Date(), 14);
   return isAfter(lastActive, limit);
}

// When a new workout gets recorded we post it to the #strava channel with these steps:
//
// 1. Calculate the amount of EXP gained from the activity
// 2. Save the workout as a log
// 3. Post it to #strava
//
// If the workout has already been posted once, the previous message will get edited instead
export const post = async (
   client: DiscordJs.Client,
   stravaId: number,
   activityId: number,
   force = false
): Promise<Error | void> => {
   // Fetch the updated user & activity data
   const user = await User.findOne ({ stravaId });
   if (!User.isAuthorized (user)) {
      log.debug ("User is not authorized with the bot", { stravaId });
      return new Error ("Could not post workout: User is not authorized (strava ID: " + stravaId + ")");
   }

   if (inactive(user)) {
      log.debug("User has not posted in a while", { lastActive: user.lastActive });
      return new Error ("User has not posted recently");
   }

   const member = await Guild.member (user.discordId, client);
   if (!member) {
      log.debug ("User is not a member of this discord");
      return new Error ("User is not a member of this discord anymore");
   }

   const accessToken = await StravaAPI.token (user.refreshToken);

   const data = await Promise.all ([
      StravaAPI.activity (activityId, accessToken),
      StravaAPI.streams (activityId, accessToken).catch (_ => [])
   ]).catch (e => new Error (`Failed to fetch Activity '${stravaId}:${activityId}' -- ${e instanceof Error ? e.message : "Unknown Reason"}`));

   if (data instanceof Error) {
      log.error ("Failed fetching activity from the strava APIs", data);
      return data;
   }

   const [activity, streams] = data;

   // We're only going to update or post activities from this week
   // which will prevent spam if a really old activity gets updated
   // (and it simplifies the "weekly exp" part of the activity post)
   const thisWeek = Week.current ();
   const timestamp = DateTime.fromISO (activity.start_date);

   if (!thisWeek.contains (timestamp) && !force) {
      log.debug ("Activity falls outside of time bounds", { timestamp: timestamp.toString (), week: thisWeek.toString () });
      return new Error (`Not posting activity ${activityId}, activity is not from this week; ` + JSON.stringify ({ timestamp: timestamp.toString (), week: thisWeek.toString () }));
   }

   // Get all the other activities the user recorded this week
   // so we can show their weekly progress in the post
   const workoutsThisWeek = await Workout.find ({
      ...Workout.recordedBy (user.discordId),
      ...Workout.during (thisWeek)
   });

   const exp = Exp.fromActivity (user.maxHR, activity, streams);
   const workout = Workout.make (user.discordId, activity, exp);
   const previouslyRecorded = workoutsThisWeek.find (w => w.activity_id === activity.id);

   log.debug ("Activity EXP", exp);

   if (!previouslyRecorded) {
      log.debug ("New activity, adding EXP to user", { gained: Exp.total (exp) });
      await User.update ({ ...user, xp: user.xp + Exp.total (exp) });
   }

   const expThisWeek = expSoFar (workout, workoutsThisWeek);

   // Create an embed that shows the name of the activity,
   // Some highlighted stats from the recording
   // And the user's Exp progress
   const content = {
      embeds: [new DiscordJs.EmbedBuilder ({
         color:       member.displayColor,
         author: {
            icon_url: member?.user?.displayAvatarURL () ?? defaultAvatar,
            name: `${member.displayName} ${activityText (activity)}`
            // `${EmojiSet.get (activity.type, workout.exp, user.emojis)} ${member.displayName} ${justDid (activity.type)}`
         },
         footer: {
            text: heartstats (activity) + gained (workout) + " | " + Format.exp (expThisWeek) + " this week"
         }
      })]
   };

   try {
      // If the workout has a message id, that means it's been posted before
      // and instead of creating yet another post we'll just edit the message
      // This lets people fix the title / activity type even after the workout has been posted
      const channel = await getStravaChannel (client);
      const message = (previouslyRecorded?.message_id)
         ? await channel.messages.fetch (previouslyRecorded.message_id)
            .then ((msg) => msg.edit (content) as Promise<DiscordJs.Message<never>>)
         : await channel.send (content);

      await Workout.save ({
         ...workout,
         message_id: message.id
      });

      log.debug ("New workout has been saved");
   }
   catch (error) {
      log.error ("Activity failed to post", error);
      const reason = error instanceof Error ? error.message : "Unknown Reason";
      return new Error (reason);
   }
};

// Remove a post based on activityId
// Also reverts
export const remove = async (activityId: number, client: DiscordJs.Client): Promise<Error | string> => {
   const workout = await Workout.findOne ({ activity_id: +activityId });

   if (!workout) {
      log.debug ("No activity found with ID", { activityId });
      return new Error (`No workout recorded with activity ID '${activityId}'`);
   }

   const [user, channel] = await Promise.all ([
      User.findOne ({ discordId: workout.discord_id }),
      getStravaChannel (client)
   ]);

   if (!User.isAuthorized (user)) {
      log.debug ("User has not authorized their strava account");
      return new Error ("User is not authorized");
   }

   const message = await channel.messages.fetch (workout.message_id);

   if (!message) {
      log.debug ("There is no message with this id", { messageId: workout.message_id });
      return new Error ("Could not find message");
   }

   try {
      const expToRemove = Exp.total (workout.exp);

      await Promise.all ([
         message.delete (),
         User.update ({ ...user, xp: user.xp - expToRemove }),
         Workout.deleteOne (workout)
      ]);

      log.debug ("Removed workout", { expRemoved: expToRemove });
      return workout.activity_name;
   }
   catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown Reason";
      log.error ("Failed removing the workout", error);
      return new Error (reason);
   }
};