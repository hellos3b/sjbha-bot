import { MessageHandler } from '@sjbha/app';
import { Subscriptions } from '../db/subscription';

export const add : MessageHandler = async message => {
  const role = message.mentions.roles[0];

  if (!role) {
    message.reply ('Failed to add tag: Missing role to add. Usage: `!subscribe add @role`');

    return;
  }
  
  const sub = await Subscriptions ().findOne ({ id: role.id });
  
  if (sub) {
    message.reply (`Subscription for role '${role.name}' already exists`);

    return;
  }

  await Subscriptions ().insertOne ({
    id:   role.id,
    name: role.name.toLowerCase ()
  });

  message.channel.send (`Added ${role.name} (${role.id}) to subscriptions`);
}