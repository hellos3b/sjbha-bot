import { Message } from 'discord.js';

import { Instance } from '@sjbha/app';
import { MessageBuilder } from '@sjbha/utils/string-formatting';
import { channels } from '@sjbha/config';

import { Workout } from '../db/workout';
import * as User from '../db/user';

const usage = 'Usage: `$fit remove {activityId}`';

/**
 * Removes a workout that has been posted,
 * in case someone messed it up or is abusing the strava bot
 * 
 * @admin
 */
 export async function remove (message: Message) : Promise<void> {
  const [/* !fit */, /* post */, activityId] = message.content.split (' ');

  if (!activityId) {
    message.reply (usage);

    return;
  }

  if (isNaN (+activityId)) {
    message.reply (`Invalid activityId '${activityId}': ${usage}`);

    return;
  }

  const workout = await Workout.findOne ({ activity_id: +activityId });

  if (!workout) {
    message.reply (`No workout recorded with activity ID '${activityId}'`);

    return;
  }
  
  const reply = new MessageBuilder ();
  const { activity_name, message_id, discord_id } = workout;

  reply.append (`Removing **${activity_name}**:`);

  const results = await Promise.all ([
    Instance.fetchMessage (channels.strava, message_id)
      .then (message => message.delete ())
      .then (_ => `> Deleted message ${message_id}`)
      .catch (error => `X Failed to delete message: ${error.message || 'Unknown error'}`),

    User.findOne ({ discordId: discord_id })
      .then (throwIfUnauthorized)
      .then (user => User.update ({ ...user, xp: user.xp - workout.totalExp }))
      .then (user => `> Removed ${workout.totalExp} exp from ${user.discordId}`)
      .catch (error => `X Failed to remove EXP from user ${discord_id}: ${error.message || 'Unknown Error'}`),

    Workout.deleteOne (workout)
      .then (_ => `> Deleted workout ${message_id}`)
      .catch (error => `X Failed to delete workout: ${error.message || 'Unknown Error'}`)
  ]);

  reply.beginCode ();
  results.forEach (log => reply.append (log));
  reply.endCode ();

  message.channel.send (reply.toString ());
}

const throwIfUnauthorized = (user: User.User | null) : User.Authorized => {
  if (!User.isAuthorized (user)) {
    throw new Error ('User is not authorized with bot');
  }

  return user;
}