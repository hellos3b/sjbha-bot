import { MessageHandler } from '@sjbha/app';
import { Subscriptions } from '../db/subscription';

export const list : MessageHandler = async message => {
  const subs = await Subscriptions ()
    .find ()
    .toArray ();

  const names = subs.map (_ => _.name).join (', ');

  message.channel.send (`Available subscriptions: ${names}`);
}