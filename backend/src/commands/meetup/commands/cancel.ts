import { Message, MessageEmbed } from 'discord.js';
import { DateTime } from 'luxon';
import MultiChoice from '@sjbha/utils/multi-choice';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';

/**
 * Cancel a meetup
 */
 export async function cancel (message: Message) : Promise<void> {
  const userMeetups = await db.find ({
    state:       { type: 'Live' },
    organizerId: message.author.id
  });
  
  // Make sure they have any meetups they can cancel
  if (!userMeetups.length) {
    message.reply ('You have no meetups to cancel');

    return;
  }

  // Pick a meetup they want to cancel
  // todo: Should add a note that they can transfer responsibility
  const meetupPicker = MultiChoice.create <db.Meetup> (
    'Which meetup would you like to cancel?',
    userMeetups.map (meetup => MultiChoice.opt (meetup.title, meetup))
  );

  await message.reply (meetupPicker.toString ());
  const meetup = await  message.channel
    .createMessageCollector (m => m.author.id === message.author.id)
    .next.then (meetupPicker.parse);

  if (!meetup) 
    return;

  // Give a reason, which we use to let people know why
  await message.reply (`What is the reason for cancelling '${meetup.title}'? (Will let the RSVP's know it was cancelled)`)
  const cancelReason = await message.channel
    .createMessageCollector (m => m.author.id === message.author.id)
    .next.then (msg => msg.content);

  if (!cancelReason)
    return;

  const posting = new MessageEmbed ({
    title:       '📅  **CANCELLED**: ~~' + meetup.title + '~~',
    color:       '#9b3128',
    description: `> ${cancelReason}`
  });

  await Promise.all ([
    M.edit (meetup, posting),
    db.update ({
      ...meetup,
      state: { 
        type:      'Cancelled', 
        reason:    cancelReason, 
        timestamp: DateTime.local ().toISO () 
      }
    })
  ]);

  message.reply (
    new MessageEmbed ({
      description: `❌ **${meetup.title}** was cancelled`
    })
  );
}