import { Handler } from '@sjbha/app';
import { Subscriptions } from '../db/subscription';

/**
 * List the available subscriptions that are in the database
 */
export const remove : Handler = async message => {
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