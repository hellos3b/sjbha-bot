import { DateTime, Duration } from 'luxon';
import { match, __ } from 'ts-pattern';
import * as DiscordJs from 'discord.js';

import { env } from '@sjbha/app';
import { channels } from '@sjbha/server';

import * as Activity from './Activity';
import * as StravaAPI from './StravaAPI';
import * as User from './User';
import * as Workout from './Workout';
import * as Week from './Week';
import * as Exp from './Exp';
import * as EmojiSet from './EmojiSet';

const defaultAvatar = 'https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png';

const format = {
  hr: (bpm: number) => 
    Math.floor (bpm).toString (),
  miles: (meters: number) => 
    (meters * 0.000621371192).toFixed (2) + 'mi',
  feet: (meters: number) => 
    (meters * 3.2808399).toFixed (0) + 'ft',
  power: (watts: number) => 
    Math.floor (watts).toString (),
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

// A simple way to represent moderate vs vigorous exp data
const gained = ({ exp }: Workout.workout) => {
  const total = Exp.total (exp);
  let str = `Gained ${format.exp (total)} exp`;

  if (exp.type === 'hr')
    str += `(${format.exp (exp.moderate)}+ ${format.exp (exp.vigorous)}++)`

  return str;
}

// Formats the part in the title with "just did xx"
const justDid = (activityType: string) : string => {
  const { type } = Activity;
  const did = {
    [type.Ride]:     'just went for a ride',
    [type.Run]:      'just went for a run',
    [type.Yoga]:     'just did some yoga',
    [type.Hike]:     'just went on a hike',
    [type.Walk]:     'just went on a walk',
    [type.Crossfit]: 'just did crossfit',
    
    [type.VirtualRide]:    'just went for an indoor ride',
    [type.RockClimbing]:   'just went rock climbing',
    [type.WeightTraining]: 'just lifted some weights'
  }[activityType];
  
  return did ?? 'just recorded a ' + activityType;
}

// Different activities have different activity stats that are worth showing.
// We'll figure out which ones to show here, otherwise default to heartrate stats (if available)
const activityStats = (activity: Activity.activity) : DiscordJs.EmbedField[] => {
  const { type } = Activity;
  const field = (name: string, value: string) =>
    ({ name, value, inline: true });

  const hr = Activity.heartRate (activity);
  const power = Activity.power (activity);
  const workoutType = Activity.workoutType (activity);

  // data fields
  const elapsed = field ('Elapsed', format.duration (activity.elapsed_time));
  const maxHr = hr && field ('Max HR', format.hr (hr.max));
  const avgHr = hr && field ('Avg HR', format.hr (hr.average));
  const distance = (activity.distance > 0) && field ('Distance', format.miles (activity.distance));
  const elevation = (activity.total_elevation_gain > 0) && field ('Elevation', format.feet (activity.total_elevation_gain));
  const pace = field ('Pace', format.pace (activity.average_speed));
  const avgWatts = power && field ('Avg Watts', format.power (power.average));

  // fields customized by activity
  // falsy fields get filtered
  const fields =
    match (activity.type)
    .with (type.Run, _ => 
      (workoutType === 'workout')
        ? [elapsed, maxHr, avgHr]
        : [elapsed, distance ?? maxHr, avgWatts ?? elevation ?? avgHr])

    .with (type.Run, _ =>
      (workoutType === 'workout')
        ? [elapsed, maxHr, avgHr]
        : [elapsed, distance ?? maxHr, pace ?? avgHr])

    .with (type.Hike, _ =>
      [elapsed, distance ?? maxHr, elevation ?? avgHr])

    .with (type.VirtualRide, _ =>
      [elapsed, distance ?? avgHr, avgWatts ?? maxHr])

    .with (type.Walk, _ =>
      [elapsed, distance, avgHr])

    .otherwise (() => [elapsed, avgHr, maxHr])

  return fields.filter ((i): i is DiscordJs.EmbedField => !!i);
}

// When a new workout gets recorded we post it to the #strava channel with these steps:
//
// 1. Calculate the amount of EXP gained from the activity
// 2. Save the workout as a log
// 3. Post it to #strava
//
// If the workout has already been posted once, the previous message will get edited instead
 export const post = async (client: DiscordJs.Client, stravaId: number, activityId: number) : Promise<void> => {
  // Fetch the updated user & activity data
  const user = await User.findOne ({ stravaId });

  if (!User.isAuthorized (user))
    throw new Error ('Could not post workout: User is not authorized (strava ID: ' + stravaId + ')');

  const accessToken = await StravaAPI.token (user.refreshToken);

  const [activity, streams] = await Promise.all ([
    StravaAPI.activity (activityId, accessToken),
    StravaAPI.streams (activityId, accessToken).catch (_ => [])
  ]).catch (e => { 
    throw new Error (`Failed to fetch Activity '${stravaId}:${activityId}' -- ${e instanceof Error ? e.message : 'Unknown Reason'}`) 
  });

  // We're only going to update or post activities from this week
  // which will prevent spam if a really old activity gets updated
  // (and it simplifies the "weekly exp" part of the activity post)
  const thisWeek = Week.current ();
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
  const workouts = await Workout.find ({
    ...Workout.recordedBy (user.discordId),
    ...Workout.during (thisWeek)
  });

  // If the workout has been recorded previously, 
  // we'll want to update it instead of insert
  const previouslyRecorded = workouts.find (w => w.activity_id === activity.id)
  const exp = Exp.fromActivity (user.maxHR, activity, streams);

  const workout = 
    previouslyRecorded 
      ? ({
        ...previouslyRecorded,
        activity_name: activity.name,
        activity_type: activity.type,
        exp:           exp
      })
      : Workout.make (user.discordId, activity, exp);
  
      // The total exp from all the workouts this week that came before this current workout
  // The "weekly exp so far" will be this value + the new workout
  const expSoFar =
    workouts
      .filter (w => w.activity_id !== activity.id)
      .filter (w => w.timestamp < timestamp.toUTC ().toISO ())
      .map (w => Exp.total (w.exp))
      .reduce ((a, b) => a + b, 0);
  
  const weeklyExp = Exp.total (workout.exp) + expSoFar;

  // Member details
  const member = await client.guilds
    .fetch (env.SERVER_ID)
    .then (guild => guild.members.fetch (user.discordId));

  const nickname = member?.displayName ?? 'Unknown';
  const avatar = member?.user?.displayAvatarURL () ?? defaultAvatar;

  // Create an embed that shows the name of the activity,
  // Some highlighted stats from the recording
  // And the user's Exp progress
  const embed = new DiscordJs.MessageEmbed ({
    color:       member?.displayColor ?? 0xffffff,
    title:       activity.name,
    description: activity.description,
    fields:      activityStats (activity),
    author:      { 
      name: `${EmojiSet.get (activity.type, workout.exp, user.emojis)} ${nickname} ${justDid (activity.type)}` 
    },
    thumbnail: { 
      url: avatar 
    },
    footer: { 
      text: gained (workout) + ' | ' + format.exp (weeklyExp) + ' exp this week' 
    }
  });

  try {
    const channel = await client.channels.fetch (channels.strava);

    if (!channel?.isText ()) {
      throw new Error ('Failed to find fitness channel');
    }
    
    // If the workout has a message id, that means it's been posted before
    // and instead of creating yet another post we'll just edit the message
    // This lets people fix the title / activity type even after the workout has been posted
    const post = { embeds: [embed] };

    const message = (workout.message_id)
      ? await channel.messages
        .fetch (workout.message_id)
        .then (msg => msg.edit (post))
      : await channel.send (post);

    await Workout.save ({
      ...workout,
      message_id: message.id
    }); 

    // If this workout was recorded previously,
    // We'll remove the xp from the user exp (kind of like an 'undo')
    // Before adding the new workout's exp
    const prevExp = 
      previouslyRecorded
        ? Exp.total (previouslyRecorded.exp)
        : 0;
        
    User.update ({ 
      ...user, 
      xp: user.xp - prevExp + Exp.total (workout.exp)
    });
  }
  catch (e) {
    console.error ('Failed to post new Activity');
    console.error (e);
  }
}

// Remove a post based on activityId
// Also reverts
export const remove = async (activityId: number, client: DiscordJs.Client) : Promise<string> => {
  const workout = await Workout.findOne ({ activity_id: +activityId });

  if (!workout)
    throw new Error (`No workout recorded with activity ID '${activityId}'`);

  const [user, channel] = await Promise.all ([
    User.findOne ({ discordId: workout.discord_id }),
    client.channels.fetch (channels.strava)
  ]);

  if (!channel?.isText ())
    throw new Error ('Failed to fetch Strava Channel');

  if (!User.isAuthorized (user))
    throw new Error ('User is not authorized');

  const message = await channel.messages.fetch (workout.message_id);

  if (!message)
    throw new Error ('Could not find message');

  await message.delete ();
  await User.update ({ ...user, xp: user.xp - Exp.total (workout.exp) })
  await Workout.deleteOne (workout);

  return workout.activity_name;
}