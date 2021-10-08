import { Message } from 'discord.js';
import { Subscriptions } from '../db/subscription';

/**
 * List the available subscriptions that are in the database
 */
export async function unsubscribe (message: Message) : Promise<void> {
  const [_, name] = message.content.split (' ');
  const sub = await Subscriptions ().findOne ({ name: name.toLowerCase () });

  if (!sub) {
    message.reply (`No subscription named '${name}' found. Use '!subscribe' to view a list of possible subscriptions`);

    return;
  }

  if (!message.member) {
    message.reply ('You cannot subscribe in DMs');

    return;
  }

  if (!message.member.roles.cache.has (sub.id)) {
    message.reply (`You are not subscribed to ${sub.name}`);

    return;
  }

  await message.member.roles.remove (sub.id);
  message.reply (`Unsubscribed from ${sub.name}`);
}