import { Handler } from '@sjbha/app';
import { Subscriptions } from '../db/subscription';

export const subscribe : Handler = async message => {
  const [_, name] = message.content.split (' ');

  const sub = await Subscriptions ().findOne ({ name: name.toLowerCase () });

  if (!sub) {
    message.reply (`No subscription named '${name}' found. Use '!subscribe' to view a list of possible subscriptions`);

    return;
  }

  if (message.member?.roles.cache.has (sub.id)) {
    message.reply (`You are already subscribed to ${sub.name}`);

    return;
  }

  await message.member?.roles.add (sub.id);
  message.reply ('Subscribed to ' + sub.name);
}