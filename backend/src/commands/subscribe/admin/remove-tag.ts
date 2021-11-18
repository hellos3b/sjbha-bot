import { Message } from 'discord.js';
import { Subscriptions } from '../db/subscription';

export async function remove (message: Message) : Promise<void> {
  const [_, __, name] = message.content.split (' ');

  if (!name) {
    message.reply ('Failed to remove tag: Missing role name to remove. Usage: `!subscribe remove {role}`');

    return;
  }
  
  const sub = await Subscriptions ().findOne ({ name });

  if (!sub) {
    message.reply (`Can't remove subscription: No subscription named '${name}' exists`);

    return;
  }

  await Subscriptions ().deleteOne ({ name });

  message.channel.send (`Removed ${name} from subscriptions`);
}