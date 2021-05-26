import { Handler } from '@sjbha/app';
import { Subscriptions } from '../db/subscription';

export const list : Handler = async message => {
  const subs = await Subscriptions ()
    .find ()
    .toArray ();

  const names = subs.map (_ => _.name).join (', ');

  message.channel.send (`Available subscriptions: ${names}`);
}