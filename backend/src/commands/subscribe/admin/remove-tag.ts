import { Message } from 'discord.js';
import { Subscriptions } from '../db/subscription';

export async function remove (message: Message) : Promise<void> {
  const [_, __, name] = message.content.split (' ');
  const collection = await Subscriptions ();

  if (!name) {
    message.reply ('Failed to remove tag: Missing role name to remove. Usage: `!subscribe remove {role}`');

    return;
  }
  
  const sub = await collection.findOne ({ name });

  if (!sub) {
    message.reply (`Can't remove subscription: No subscription named '${name}' exists`);

    return;
  }

  await collection.deleteOne ({ name });

  message.channel.send (`Removed ${name} from subscriptions`);
}