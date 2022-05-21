import { Message } from 'discord.js';
import * as Subscription from './Subscription';
import * as Format from '@sjbha/utils/Format';

const withReply = (content: string, message: Message) : void => {
  message.reply (content);
}

export const help = async (message: Message) : Promise<void> => {
  const help = Format.help ({
    commandName: 'subscribe (admin)',
    description: 'Add or remove roles to the list of possible subscriptions',
    usage:       '$subscribe <command> [...options]',
    commands:    {
      'add <@role>':       'Add a new subscription',
      'remove <rolename>': 'Remove an existing subscription'
    }
  });

  message.channel.send (help);
}

export const addSubscription = async (message: Message) : Promise<void> => {
  const role = message.mentions.roles.first ();
  const collection = await Subscription.collection ();

  if (!role)
    return withReply ('Failed to add tag: Missing role to add. Usage: `!subscribe add @role`', message);
  
  const sub = await collection.findOne ({ id: role.id });
  
  if (sub)
    return withReply (`Subscription for role '${role.name}' already exists`, message);

  await collection.insertOne ({
    id:   role.id,
    name: role.name.toLowerCase ()
  });

  message.channel.send (`Added ${role.name} (${role.id}) to subscriptions`);
}

export const removeSubscription = async (message: Message) : Promise<void> => {
  const [_, __, name] = message.content.split (' ');
  const collection = await Subscription.collection ();

  if (!name)
    return withReply ('Failed to remove tag: Missing role name to remove. Usage: `!subscribe remove {role}`', message);
  
  const sub = await collection.findOne ({ name });

  if (!sub) 
    return withReply (`Can't remove subscription: No subscription named '${name}' exists`, message);

  await collection.deleteOne ({ name });
  message.channel.send (`Removed ${name} from subscriptions`);
}