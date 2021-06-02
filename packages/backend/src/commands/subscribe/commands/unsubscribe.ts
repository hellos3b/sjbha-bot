import { MessageHandler } from '@sjbha/app';
import { Subscriptions } from '../db/subscription';

/**
 * List the available subscriptions that are in the database
 */
export const unsubscribe : MessageHandler = async message => {
  const [_, target] = message.content.split (' ');

  if (!message.member) {
    throw new Error ('Subscription commands should not work in DMs');
  }

  if (!target) {
    message.reply (`No subscription named '${target}' found. Use '!subscribe' to view a list of possible subscriptions`);

    return;
  }

  const sub = await Subscriptions ().findOne ({ name: target.toLowerCase () });

  if (!sub) {
    message.reply (`No subscription named '${target}' found. Use '!subscribe' to view a list of possible subscriptions`);

    return;
  }

  if (!message.member.roles.cache.has (sub.id)) {
    message.reply (`You aren't subscribed to ${sub.name}`);

    return;
  }
  
  await message.member.roles.remove (sub.id);
  message.reply ('Unsubscribed from ' + sub.name);
}