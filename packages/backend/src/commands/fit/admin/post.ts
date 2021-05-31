import { MessageHandler } from '@sjbha/app';
import { postWorkout } from '../features/activity-post';

const usage = 'Usage: `!fit post {stravaId} {activityId}`';

export const post : MessageHandler = async message => {
  const [/** !fit */, /** post */, stravaId, activityId] = message.content.split (' ');

  if (!stravaId || !activityId) {
    message.reply (usage);

    return;
  }

  if (isNaN (+stravaId) || isNaN (+activityId)) {
    message.reply ('Invalid stravaId or activityId: ' + usage);

    return;
  }

  postWorkout (+stravaId, +activityId)
    .catch (e => {
      console.error (e);
      message.reply ('Failed to post: ' + e.message)
    });
}