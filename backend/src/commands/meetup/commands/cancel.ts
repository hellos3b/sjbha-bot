import Meetup from '../core/Meetup';
import { Message, MessageEmbed } from 'discord.js';
import MultiChoice from '@sjbha/utils/multi-choice';

/**
 * Cancel a meetup
 */
 export async function cancel (message: Message) : Promise<void> {
  const userMeetups = Meetup.find (meetup => meetup.isLive && meetup.organizerId === message.author.id)
  
  // Make sure they have any meetups they can cancel
  if (!userMeetups.size) {
    message.reply ('You have no meetups to cancel');

    return;
  }

  // Pick a meetup they want to cancel
  const meetupPicker = MultiChoice.create <Meetup> (
    'Which meetup would you like to cancel?',
    userMeetups.map (meetup => 
      MultiChoice.opt (`${meetup.time.toLocaleString ()} ${meetup.title}`, meetup)
    )
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


  // Cancel the meetup
  await meetup.cancel (cancelReason);

  const embed = new MessageEmbed ({
    description: `❌ **${meetup.title}** was cancelled`
  });

  message.reply (embed);
}