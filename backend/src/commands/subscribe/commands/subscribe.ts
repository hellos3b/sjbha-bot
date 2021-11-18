import { Message } from 'discord.js';
import { Subscriptions } from '../db/subscription';

export async function subscribe (message: Message) : Promise<void> {
  const [_, name] = message.content.split (' ');
  const collection = await Subscriptions ();
  const sub = await collection.findOne ({ name: name.toLowerCase () });

  if (!sub) {
    message.reply (`No subscription named '${name}' found. Use '!subscribe' to view a list of possible subscriptions`);

    return;
  }

  if (!message.member) {
    message.reply ('You cannot subscribe in DMs');

    return;
  }

  if (message.member.roles.cache.has (sub.id)) {
    message.reply (`You are already subscribed to ${sub.name}`);

    return;
  }

  await message.member.roles.add (sub.id);
  message.reply (`Subscribed to ${sub.name}`);
}