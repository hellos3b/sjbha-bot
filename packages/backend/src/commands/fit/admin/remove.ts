import { MessageHandler, Instance } from '@sjbha/app';
import * as format from '@sjbha/utils/string-formatting';

import * as Workout from '../db/workout';
import * as User from '../db/user';
import { channels } from '@sjbha/config';

const usage = 'Usage: `$fit remove {activityId}`';

export const remove : MessageHandler = async message => {
  const [/** !fit */, /** post */, activityId] = message.content.split (' ');

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
  
  const exp = Workout.expTotal (workout.exp);
  const reply = new format.MessageBuilder ();

  reply.addLine (`Removing **${workout.activity_name}**:`);

  const results = await Promise.all ([
    Instance.getMessage (channels.strava, workout.message_id)
      .then (message => message.delete ())
      .then (_ => `-> Deleted message ${workout.message_id}`)
      .catch (error => `❌ Failed to delete message: ${error.message || 'Unknown error'}`),

    User.findOne ({ discordId: workout.discord_id })
      .then (throwIfUnauthorized)
      .then (user => User.update ({ ...user, xp: user.xp - exp }))
      .then (user => `-> Removed ${exp} exp from ${user.discordId}`)
      .catch (error => `❌ Failed to remove EXP from user ${workout.discord_id}: ${error.message || 'Unknown Error'}`),

    Workout.remove (workout)
      .then (_ => `-> Deleted workout ${workout.message_id}`)
      .catch (error => `❌ Failed to delete workout: ${error.message || 'Unknown Error'}`)
  ]);

  results.forEach (reply.addLine);

  message.channel.send (reply.toString ());
}

const throwIfUnauthorized = (user: User.User | null) : User.Authorized => {
  if (!User.isAuthorized (user)) {
    throw new Error ('User is not authorized with bot');
  }

  return user;
}