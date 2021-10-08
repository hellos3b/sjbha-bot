import { DateTime, Duration } from 'luxon';
import { Just, Maybe, Nothing } from 'purify-ts';
import { just, match } from 'variant';

import { Instance, EmbedField, MessageEmbed } from '@sjbha/app';
import { channels } from '@sjbha/config';

import { 
  StravaClient, 
  Activity, 
  StreamResponse, 
  WorkoutType
} from '../common/StravaClient';

import * as User from '../db/user';
import { Workout, Exp, sumExp, Workouts } from '../db/workout';
import { currentWeek } from '../common/week';

/**
 * When a new workout gets recorded we post it to the #strava channel with these steps:
 * 
 * 1. Calculate the amount of EXP gained from the activity
 * 2. Save the workout as a log
 * 3. Post it to #strava
 *
 * If the workout has already been posted once, the previous message will get edited instead
 */
export const postWorkout = async (stravaId: number, activityId: number) : Promise<void> => {
  // Fetch the updated user & activity data
  const user = await User.findOne ({ stravaId });

  if (!User.isAuthorized (user)) {
    throw new Error ('Could not post workout: User is not authorized (strava ID: ' + stravaId + ')');
  }

  const client = await StravaClient.authenticate (user.refreshToken);

  const [activity, streams] = await Promise.all ([
    client.getActivity (activityId),
    client.getActivityStreams (activityId).catch (_ => [])
  ]);

  console.log ('ACTIVITY', activity);
  
  // We're only going to update or post activities from this week
  // which will prevent spam if a really old activity gets updated
  // (and it simplifies the "weekly exp" part of the activity post)
  const thisWeek = currentWeek ();
  const timestamp = DateTime.fromISO (activity.start_date);

  if (!thisWeek.contains (timestamp)) {
    console.log (
      `Not posting activity ${activityId}, activity is not from this week`, 
      { timestamp: timestamp.toString (), week: thisWeek.toString () }
    );

    return;
  }


  // Get all the other activities the user recorded this week
  // so we can show their weekly progress in the post
  const workouts = await Workouts ()
    .recordedBy (user.discordId)
    .during (thisWeek)
    .find ();

  // If the workout has been recorded previously, 
  // we'll want to update it instead of insert
  const previouslyRecorded = Maybe.fromNullable (
    workouts.find (w => w.activity_id === activity.id)
  );
  
  const exp = calculateExp (user.maxHR, activity, streams);

  const workout = previouslyRecorded.map (prev => prev.extend ({
      activity_name: activity.name,
      activity_type: activity.type,
      exp:           exp
    }))
    .orDefaultLazy (() => Workout.create (user.discordId, activity, exp));


  // The total exp from all the workouts this week that came before this current workout
  // The "weekly exp so far" will be this value + the new workout
  const expSoFar = sumExp (
    workouts
      .filter (w => w.activity_id !== activity.id)
      .filter (w => w.timestamp < timestamp.toUTC ().toISO ())
  );
  
  const weeklyExp = workout.totalExp + expSoFar;
  const member = await Instance.fetchMember (user.discordId);

  const displayColor = member.mapOrDefault (m => m.displayColor, 0xffffff);
  const nickname = member.mapOrDefault (m => m.nickname, 'Unknown');
  const avatar = member.mapOrDefault (m => m.avatar, 'https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png');

  // Create an embed that shows the name of the activity,
  // Some highlighted stats from the recording
  // And the user's Exp progress
  const embed = new MessageEmbed ({
    color:       displayColor,
    title:       activity.name,
    description: activity.description,
    fields:      activityStats (activity),
    author:      { 
      name: `${workout.emoji (user.emojis)} ${nickname} ${justDid (activity)}` 
    },
    thumbnail: { 
      url: avatar 
    },
    footer: { 
      text: gainedText (workout) + ' | ' + format.exp (weeklyExp) + ' exp this week' 
    }
  });


  try {
    // If the workout has a message id, that means it's been posted before
    // and instead of creating yet another post we'll just edit the message
    // This lets people fix the title / activity type even after the workout has been posted
    const message = (workout.message_id)
      ? await Instance
        .fetchMessage (channels.strava, workout.message_id)
        .then (message => message.edit (embed))
      : await Instance
        .fetchChannel (channels.strava)
        .then (c => c.send (embed));

    await workout
      .extend ({ message_id: message.id })
      .save ();
        

    // If this workout was recorded previously,
    // We'll remove the xp from the user exp (kind of like an 'undo')
    // Before adding the new workout's exp
    const prevExp = previouslyRecorded.mapOrDefault (prev => prev.totalExp, 0);

    User.update ({ 
      ...user, 
      xp: user.xp - prevExp + workout.totalExp
    });
  }
  catch (e) {
    console.error ('Failed to post new Activity');
    console.error (e);
  }
}


/**
 * Calculate the amount of EXP gained from a workout.
 * 
 * If the user has their Max heartrate set and the activity was recorded with an HR compatible device,
 *   the user will get 1 exp for every second in Moderate (max heartrate x 0.5)
 *   and 2 exp for every second in Vigorous (max heartrate x 0.75)
 * 
 * If there is no heart rate data available, the calculation defaults to 1exp per second of moving time
 * 
 * @param maxHeartrate The user's set max heart rate
 * @param activity Activity data from strava
 * @param streams Samples of the users heart rate data from the recording
 * @returns Calculated result of either HR Exp or Time based Exp
 */
const calculateExp = (maxHeartrate: number | undefined, activity: Activity, streams: StreamResponse) : Exp => {
  const hr = Maybe
    .fromNullable (streams.find (s => s.type === 'heartrate'))
    .mapOrDefault (s => s.data, []);

  const time = Maybe
    .fromNullable (streams.find (s => s.type === 'time'))
    .mapOrDefault (s => s.data, []);

  // Max HR and hr data is required to be calculated by hr
  if (maxHeartrate && hr.length && time.length) {
    const moderate = maxHeartrate * 0.5;
    const vigorous = maxHeartrate * 0.75;

    let moderateSeconds = 0;
    let vigorousSeconds = 0;

    for (let i = 0; i < hr.length; i++) {
      const bpm = hr[i];
      const seconds = (time[i + 1])
        ? (time[i + 1] - time[i])
        : 0;

      if (bpm >= vigorous) {
        vigorousSeconds += seconds;
      }
      else if (bpm >= moderate) {
        moderateSeconds += seconds;
      }
    }

    // gotta convert to minutes
    return Exp.hr (
      moderateSeconds / 60, 
      (vigorousSeconds / 60) * 2
    );
  }
  else {
    const minutes = activity.moving_time / 60;

    return Exp.time (minutes);
  }
}


/**
 * Formatting of the footer text that shows how much EXP was gained from this workout
 * 
 * @param exp 
 * @returns The string to place in the footer
 */
const gainedText = (workout: Workout.Model) => match (workout.exp, {
  hr: ({ moderate, vigorous }) => 
    `Gained ${format.exp (workout.totalExp)} exp (${format.exp (moderate)}+ ${format.exp (vigorous)}++)`,
  time: _ => 
    `Gained ${format.exp (workout.totalExp)}`
});

/**
 * Formats the part in the title with "just did xx"
 * 
 * @returns The string to use in the title
 */
const justDid = (activity: Activity) : string => match (activity, {
  Ride:     just ('just went for a ride'),
  Run:      just ('just went for a run'),
  Yoga:     just ('just did some yoga'),
  Hike:     just ('just went on a hike'),
  Walk:     just ('just went on a walk'),
  Workout:  just ('just did a workout'),
  Crossfit: just ('just did crossfit'),

  VirtualRide:    just ('just went for an indoor ride'),
  RockClimbing:   just ('just went rock climbing'),
  WeightTraining: just ('just lifted some weights'),
  
  default: just ('Just recorded a ' + activity.type)
});


/**
 * Different activities have different activity stats that are worth showing.
 * We'll figure out which ones to show here, otherwise default to heartrate stats (if available)
 * 
 * @param activity 
 * @returns An array of fields to use in the embed
 */
const activityStats = (activity: Activity) : EmbedField[] => {
  const field = <A>(name: string, value: (a: A) => string) => 
    (a: A) : EmbedField => ({ name, value: value (a), inline: true });

  // Total amount of time that elapsed while the activity was recording
  const elapsed = field ('Elapsed', (a: Activity) => format.duration (a.elapsed_time)) (activity);

  // Heartrate fields
  const hr = activity.has_heartrate ? Just (activity) : Nothing;
  const averageHeartrate = hr.map (field ('Avg HR', a => format.hr (a.average_heartrate)));
  const maxHeartrate = hr.map (field ('Max HR', a => format.hr (a.max_heartrate)));
  const heartrate = Maybe.sequence ([averageHeartrate, maxHeartrate]);

  // GPS based fields
  const gps = Just (activity).filter (a => a.distance > 0);
  const distance = gps.map (field ('Distance', a => format.miles (a.distance)));

  // Return none if elevation gain === 0, as this usually means
  // this was an indoor run
  const elevation = gps.filter (a => a.total_elevation_gain > 0)
    .map (field ('Elevation', a => format.feet (a.total_elevation_gain)));
  const pace = gps.map (field ('Pace', a => format.pace (a.average_speed)));

  // Power based fields
  const power = activity.device_watts ? Just (activity) : Nothing;
  const avgPower = power.map (field ('Avg Watts', a => format.power (a.weighted_average_watts)));
  // const maxPower = power.map (field ('Max Watts', a => format.power (a.max_watts)));

  const activitySpecific : EmbedField[] = match (activity, {
    // We want to show GPS activity first unless the activity is marked as a workout, 
    // then we show the HR stats instead
    Run: _ => 
      Maybe.sequence ([distance, pace])
        .filter (_ => activity.workout_type !== WorkoutType.RunningWorkout)
        .alt (heartrate)
        .orDefault ([]),

    // We want to show GPS activity first unless the activity is marked as a workout, 
    // then we show the HR stats instead
    Ride: _ => {
      const second = elevation
        .alt (avgPower)
        .alt (averageHeartrate);

      return Maybe.sequence ([distance, second])
        .filter (_ => activity.workout_type !== WorkoutType.RideWorkout)
        .alt (heartrate)
        .orDefault ([])
    },

    Hike: _ => 
      Maybe.sequence ([distance, elevation])
        .alt (heartrate)
        .orDefault ([]),

    VirtualRide: _ => {
      const fieldA = distance.alt (averageHeartrate);
      const fieldB = avgPower.alt (elevation).alt (maxHeartrate);

      return [fieldA.extractNullable (), fieldB.extractNullable ()]
        .filter ((f): f is EmbedField => !!f);
    },
    
    Walk: _ =>
      Maybe.catMaybes ([distance, averageHeartrate]),

    Yoga: _ =>
      heartrate.orDefault ([]),

    default: () => heartrate.orDefault ([])
  });

  return [elapsed, ...activitySpecific];
}


/**
 * Format conversions to use in the embed
 */
const format = {
  hr: (bpm: number) => Math.floor (bpm).toString (),

  miles: (meters: number) => (meters * 0.000621371192).toFixed (2) + 'mi',

  feet: (meters: number) => (meters * 3.2808399).toFixed (0) + 'ft',

  power: (watts: number) => Math.floor (watts).toString (),

  duration: (seconds: number) => {
    const d = Duration.fromObject ({ seconds });
    
    if (d.as ('hours') > 1) 
      return d.toFormat ('h\'h\' mm\'m\'');
    else if (d.as ('minutes') > 0) 
      return d.toFormat ('m\'m\' ss\'s\'');
    else
      return d.toFormat ('s\'s\'');
  },

  pace: (ms: number) => {
    const t = Duration.fromObject ({
      minutes: (26.8224 / ms)
    });

    return (t.as ('hours') > 1)
      ? t.toFormat ('hh:mm:ss')
      : t.toFormat ('mm:ss');
  },

  exp: (amt: number) => 
    (amt >= 1000) ? (amt / 1000).toFixed (1) + 'k'
    : amt.toFixed (1)
};