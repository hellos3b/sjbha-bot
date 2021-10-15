import { Message } from 'discord.js';
import { DateTime } from 'luxon';

import * as db from '../db/meetups';

/**
 * Cancel a meetup
 */
export async function cancel (message: Message) : Promise<void> {
  console.log (`${message.author.username} is trying to Cancel a meetup`);

  if (!message.channel.isThread ()) {
    message.reply ('To cancel a meetup, use `!meetup cancel <reason>` in the meetup\'s thread');
    return;
  }

  const meetup = await db.findOne ({ threadID: message.channelId });
  
  if (!meetup) {
    message.reply ('Hm, it doesnt look like this thread is for a meetup');
    return;
  }

  if (meetup.organizerID !== message.author.id) {
    message.reply ('You do not have permissions to cancel this meetup');
    return;
  }

  const [_, __, ...reasonArr] = message.content.split (' ');
  const reason = reasonArr.join (' ');

  if (!reason) {
    message.reply ('Please specific a reason for cancellation after the command: `!meetup cancel Some words why this meetup is beign cancelled`');
    return;
  }

  await db.update ({
    ...meetup,
    state: { 
      type:      'Cancelled', 
      reason:    reason, 
      timestamp: DateTime.local ().toISO () 
    }
  });

  await message.channel.setName (`(Cancelled) - ${meetup.title}`);
  await message.channel.send ({ content: 'This meetup has been cancelled' });
}