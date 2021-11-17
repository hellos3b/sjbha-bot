import { Message } from 'discord.js';
import { Subscriptions } from '../db/subscription';

export async function list (message : Message) : Promise<void> {
  const collection = await Subscriptions ();
  const subs = await collection.find ().toArray ();
  const names = subs.map (sub => sub.name).join (', ');

  message.channel.send (`Available subscriptions: ${names}`);
}