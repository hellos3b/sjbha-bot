import { DateTime } from 'luxon';
import { match, __ } from 'ts-pattern';
import * as DiscordJs from 'discord.js';

import { channels } from '@sjbha/server';
import * as Guild from '@sjbha/Guild';

import * as Activity from './Activity';
import * as StravaAPI from './StravaAPI';
import * as User from './User';
import * as Workout from './Workout';
import * as Week from './Week';
import * as Exp from './Exp';
import * as EmojiSet from './EmojiSet';
import * as Format from './Format';

const defaultAvatar = 'https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png';

const getStravaChannel = async (client: DiscordJs.Client) : Promise<DiscordJs.TextBasedChannels> => {
  const channel = await client.channels.fetch (channels.strava);
  if (!channel?.isText ())
    throw new Error ('Failed to find fitness channel');
  return channel;
}

// A simple way to represent moderate vs vigorous exp data
const gained = ({ exp }: Workout.workout) => {
  const total = Exp.total (exp);
  let str = `Gained ${Format.exp (total)} exp`;

  if (exp.type === 'hr')
    str += `(${Format.exp (exp.moderate)}+ ${Format.exp (exp.vigorous)}++)`

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
  };
  
  return did[activityType] ?? 'just recorded a ' + activityType;
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
  const elapsed = field ('Elapsed', Format.duration (activity.elapsed_time));
  const maxHr = hr && field ('Max HR', Format.hr (hr.max));
  const avgHr = hr && field ('Avg HR', Format.hr (hr.average));
  const distance = (activity.distance > 0) && field ('Distance', Format.miles (activity.distance));
  const elevation = (activity.total_elevation_gain > 0) && field ('Elevation', Format.feet (activity.total_elevation_gain));
  const pace = field ('Pace', Format.pace (activity.average_speed));
  const avgWatts = power && field ('Avg Watts', Format.power (power.average));

  // fields customized by activity
  // falsy fields get filtered
  const fields =
    match (activity.type)
    .with (type.Ride, _ => 
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

export const expSoFar = (workout: Workout.workout, workouts: Workout.workout[]) : number => {
  const previousExp = workouts
    .filter (w => w.timestamp < workout.timestamp)
    .filter (w => w.activity_id !== workout.activity_id)
    .map (w => w.exp);

  return Exp.sum (previousExp) + Exp.total (workout.exp);
}

// When a new workout gets recorded we post it to the #strava channel with these steps:
//
// 1. Calculate the amount of EXP gained from the activity
// 2. Save the workout as a log
// 3. Post it to #strava
//
// If the workout has already been posted once, the previous message will get edited instead
 export const post = async (client: DiscordJs.Client, stravaId: number, activityId: number) : Promise<Error | void> => {
  // Fetch the updated user & activity data
  const user = await User.findOne ({ stravaId });
  if (!User.isAuthorized (user))
    return new Error ('Could not post workout: User is not authorized (strava ID: ' + stravaId + ')');

  const member = await Guild.member (user.discordId, client);
  if (!member)
    return new Error ('User is not a member of this discord anymore');
    
  const accessToken = await StravaAPI.token (user.refreshToken);

  const data = await Promise.all ([
    StravaAPI.activity (activityId, accessToken),
    StravaAPI.streams (activityId, accessToken).catch (_ => [])
  ]).catch (e => new Error (`Failed to fetch Activity '${stravaId}:${activityId}' -- ${e instanceof Error ? e.message : 'Unknown Reason'}`));

  if (data instanceof Error)
    return data;

  const [activity, streams] = data;

  // We're only going to update or post activities from this week
  // which will prevent spam if a really old activity gets updated
  // (and it simplifies the "weekly exp" part of the activity post)
  const thisWeek = Week.current ();
  const timestamp = DateTime.fromISO (activity.start_date);

  if (!thisWeek.contains (timestamp))
    return new Error (`Not posting activity ${activityId}, activity is not from this week; ` + JSON.stringify ({ timestamp: timestamp.toString (), week: thisWeek.toString () }));

  // Get all the other activities the user recorded this week
  // so we can show their weekly progress in the post
  const workoutsThisWeek = await Workout.find ({
    ...Workout.recordedBy (user.discordId),
    ...Workout.during (thisWeek)
  });

  const exp = Exp.fromActivity (user.maxHR, activity, streams);
  const workout = Workout.make (user.discordId, activity, exp);
  const previouslyRecorded = workoutsThisWeek.find (w => w.activity_id === activity.id);

  if (!previouslyRecorded)
    await User.update ({ ...user, xp: user.xp + Exp.total (exp) });

  const expThisWeek = expSoFar (workout, workoutsThisWeek);

  // Create an embed that shows the name of the activity,
  // Some highlighted stats from the recording
  // And the user's Exp progress
  const content = {
    embeds: [new DiscordJs.MessageEmbed ({
      color:       member.displayColor,
      title:       activity.name,
      description: activity.description,
      fields:      activityStats (activity),
      author:      { 
        name: `${EmojiSet.get (activity.type, workout.exp, user.emojis)} ${member.displayName} ${justDid (activity.type)}` 
      },
      thumbnail: { 
        url: member?.user?.displayAvatarURL () ?? defaultAvatar 
      },
      footer: { 
        text: gained (workout) + ' | ' + Format.exp (expThisWeek) + ' exp this week' 
      }
    })]
  };

  try {
    // If the workout has a message id, that means it's been posted before
    // and instead of creating yet another post we'll just edit the message
    // This lets people fix the title / activity type even after the workout has been posted
    const channel = await getStravaChannel (client);
    const message = (previouslyRecorded?.message_id)
      ? await channel.messages.fetch (previouslyRecorded.message_id).then (msg => msg.edit (content))
      : await channel.send (content);

    await Workout.save ({
      ...workout,
      message_id: message.id
    }); 
  }
  catch (e) {
    console.error ('Failed to post new Activity', e);
    const reason = e instanceof Error ? e.message : 'Unknown Reason';
    return new Error (reason);
  }
}

// Remove a post based on activityId
// Also reverts
export const remove = async (activityId: number, client: DiscordJs.Client) : Promise<Error|string> => {
  const workout = await Workout.findOne ({ activity_id: +activityId });

  if (!workout)
    return new Error (`No workout recorded with activity ID '${activityId}'`);

  const [user, channel] = await Promise.all ([
    User.findOne ({ discordId: workout.discord_id }),
    getStravaChannel (client)
  ]);

  if (!User.isAuthorized (user))
    return new Error ('User is not authorized');

  const message = await channel.messages.fetch (workout.message_id);

  if (!message)
    return new Error ('Could not find message');

  try {
    await Promise.all ([
      message.delete (),
      User.update ({ ...user, xp: user.xp - Exp.total (workout.exp) }),
      Workout.deleteOne (workout)
    ]);

    return workout.activity_name;
  }
  catch (e) {
    const reason = e instanceof Error ? e.message : 'Unknown Reason';
    return new Error (reason);
  }
}