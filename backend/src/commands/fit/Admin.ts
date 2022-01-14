import * as DiscordJs from 'discord.js';
import { table } from 'table';
import * as format from '@sjbha/utils/Format';
import { env } from '@sjbha/app';

import * as Member from '@sjbha/Guild';
import * as WorkoutEmbed from './WorkoutEmbed';
import * as Exp from './Exp';
import * as Workout from './Workout';
import * as Promotions from './Promotions';

// reply to a message but return void,
// to simplify early exiting
const withReply = (content: string, message: DiscordJs.Message) : void => {
  message.reply (content);
  return;
}

// List all recent activities, in case you need to delete / edit one
export const listWorkouts = async (message: DiscordJs.Message) : Promise<void> => {
  const workouts = await Workout.find ({}, { limit: 20 });

  const row = async (workout: Workout.workout) => {
    const member = await Member.member (workout.discord_id, message.client);

    return [
      workout.activity_id.toString (),
      Workout.started (workout).toFormat ('hh:mma'),
      '@' + (member?.displayName ?? '<unknown>'),
      Exp.total (workout.exp).toFixed (1),
      workout.activity_name
    ]
  };

  const rows = await Promise.all (workouts.map (row));

  message.channel.send (
    format.code (table (rows, {
      drawHorizontalLine: () => false,
      drawVerticalLine:   () => false
    }))
  ); 
}

// Manually post a workout (or update one if it got stuck)
export const post = async (message: DiscordJs.Message) : Promise<void> => {
  const [/** !fit */, /** post */, stravaId, activityId] = message.content.split (' ');
  const usage = 'Usage: `!fit post {stravaId} {activityId}`';

  if (!stravaId || !activityId)
    return withReply (usage, message);

  if (isNaN (+stravaId) || isNaN (+activityId))
    return withReply ('Invalid stravaId or activityId: ' + usage, message);

  message.reply ('Posting workout!');
  
  const error = await WorkoutEmbed.post (message.client, +stravaId, +activityId);

  if (error) {
    console.error ('Could not post workout', error);
    message.reply (error.message);
  }
}

// Removes a workout that has been posted,
// in case someone messed it up or is abusing the strava bot
export async function remove (message: DiscordJs.Message) : Promise<void> {
  const [/* !fit */, /* post */, activityId] = message.content.split (' ');
  const usage = 'Usage: `$fit remove {activityId}`';

  if (!activityId)
    return withReply (usage, message);

  if (isNaN (+activityId)) 
    return withReply (`Invalid activityId '${activityId}': ${usage}`, message);

  const result = await WorkoutEmbed.remove (+activityId, message.client);
  if (result instanceof Error) {
    console.error (result);
    message.reply (result.message);
  }
  else {
    message.reply (`Removed activity '${result}'`);
  }
}


// Force the promotions to happen
// This should only be used in a dev environment because it's hard to reverse
 export const promote = async (message: DiscordJs.Message) : Promise<void> => {
  if (env.IS_PRODUCTION) {
    message.reply ('Beginning promotions');
    await Promotions.runPromotions (message.client);
  }
  else {
    message.reply ('Can only force promote in development')
  }
}