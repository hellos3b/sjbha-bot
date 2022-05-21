import { Message } from 'discord.js';
import * as Subscription from './Subscription';

const withReply = (content: string, message: Message) : void => {
  message.reply (content);
}

export const list = async (message : Message) : Promise<void> => {
  const collection = await Subscription.collection ();
  const subs = await collection.find ().toArray ();
  const names = subs.map (sub => sub.name).join (', ');

  message.channel.send (`Available subscriptions: ${names}`);
}

export const subscribe = async (message: Message) : Promise<void> => {
  const [_, name] = message.content.split (' ');
  const collection = await Subscription.collection ();
  const sub = await collection.findOne ({ name: name.toLowerCase () });

  if (!sub)
    return withReply (`No subscription named '${name}' found. Use '!subscribe' to view a list of possible subscriptions`, message);

  if (!message.member)
    return withReply ('You cannot subscribe in DMs', message);

  if (message.member.roles.cache.has (sub.id))
    return withReply (`You are already subscribed to ${sub.name}`, message);

  await message.member.roles.add (sub.id);
  message.reply (`Subscribed to ${sub.name}`);
}

export const unsubscribe = async (message: Message) : Promise<void> => {
  const [_, name] = message.content.split (' ');
  const collection = await Subscription.collection ();
  const sub = await collection.findOne ({ name: name.toLowerCase () });

  if (!sub)
    return withReply (`No subscription named '${name}' found. Use '!subscribe' to view a list of possible subscriptions`, message);

  if (!message.member)
    return withReply ('You cannot subscribe in DMs', message);

  if (!message.member.roles.cache.has (sub.id))
    return withReply (`You are not subscribed to ${sub.name}`, message);

  await message.member.roles.remove (sub.id);
  message.reply (`Unsubscribed from ${sub.name}`);
}