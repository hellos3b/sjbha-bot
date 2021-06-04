import { MessageHandler } from '@sjbha/app';
import { Left, Right } from 'purify-ts';
import { Subscriptions } from '../db/subscription';

export const subscribe : MessageHandler = async message => {
  const [_, name] = message.content.split (' ');
  const sub = await Subscriptions ().findOne ({ name: name.toLowerCase () });

  if (!sub) {
    message.reply (`No subscription named '${name}' found. Use '!subscribe' to view a list of possible subscriptions`);

    return;
  }

  const member = message.member
    .toEither ('You cannot subscribe in DMs')
    .chain (m => m.roles.has (sub.id) 
      ? Left ('You are already subscribed to ' + sub.name)
      : Right (m)
    );
    
  const addRole = member.caseOf ({
    Left:  error => Promise.resolve (error),
    Right: m => m.roles.add (sub.id).then (_ => 'Subscribed to ' + sub.name)
  });

  addRole.then (message.reply);
}