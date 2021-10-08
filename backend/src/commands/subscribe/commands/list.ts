import { Message } from 'discord.js';
import { Subscriptions } from '../db/subscription';

export async function list (message : Message) : Promise<void> {
  const subs = await Subscriptions ().find ().toArray ();
  const names = subs.map (_ => _.name).join (', ');

  message.channel.send (`Available subscriptions: ${names}`);
}