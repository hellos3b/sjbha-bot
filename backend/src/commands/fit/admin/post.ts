import { Message } from 'discord.js';
import { postWorkout } from '../features/post-workout';

const usage = 'Usage: `!fit post {stravaId} {activityId}`';

export async function post (message: Message) : Promise<void> {
  const [/** !fit */, /** post */, stravaId, activityId] = message.content.split (' ');

  if (!stravaId || !activityId) {
    message.reply (usage);

    return;
  }

  if (isNaN (+stravaId) || isNaN (+activityId)) {
    message.reply ('Invalid stravaId or activityId: ' + usage);

    return;
  }

  message.reply ('Posting workout!');
  
  postWorkout (+stravaId, +activityId)
    .catch (e => {
      console.error (e);
      message.reply ('Failed to post: ' + e.message)
    });
}