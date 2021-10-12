import { Message, MessageEmbed } from 'discord.js';
import { DateTime } from 'luxon';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';

/**
 * Cancel a meetup
 */
export async function cancel (message: Message) : Promise<void> {
  if (!message.channel.isThread ()) {
    message.reply ('To cancel a meetup, use `!meetup cancel <reason>` in the meetup\'s thread');
    return;
  }

  const [_, __, ...reasonArr] = message.content.split (' ');
  const reason = reasonArr.join (' ');

  if (!reason) {
    message.reply ('Please specific a reason for cancellation after the command: `!meetup cancel Some words why this meetup is beign cancelled`');
    return;
  }

  const meetup = await db.findOne ({ threadID: message.channelId });
  
  if (!meetup) {
    message.reply ('Hm, it doesnt look like this thread is for a meetup');
    return;
  }

  const posting = new MessageEmbed ({
    title:       `📅  **CANCELLED**: ~~${meetup.title}~~`,
    color:       '#9b3128',
    description: `> ${reason}`
  });

  await Promise.all ([
    M.edit (meetup, posting),
    db.update ({
      ...meetup,
      state: { 
        type:      'Cancelled', 
        reason:    reason, 
        timestamp: DateTime.local ().toISO () 
      }
    })
  ]);

  await message.channel.send ({ content: 'This meetup has been cancelled' });
  await message.channel.setArchived (true);
}