import { Message } from 'discord.js';
import * as db from '../db/meetups';

// Notify all RSVPs about details of the meetup
export async function announce (message: Message) : Promise<void> {
  if (!message.channel.isThread ()) {
    message.reply ('To cancel a meetup, use `!meetup cancel <reason>` in the meetup\'s thread');
    return;
  }

  console.log (message.channelId, message.channel.id);
  const meetup = await db.findOne ({ threadID: message.channelId });
  
  if (!meetup) {
    message.reply ('Hm, it doesnt look like this thread is for a meetup');
    return;
  }

  if (message.author.id !== meetup.organizerID) {
    message.reply ('Sorry, only the organizer can publish an announcement')
    return;
  }

  await message.channel.send ('Alright, let everyone know what you want to say and I\'ll ping them');

  const collected = await message.channel.awaitMessages ({
    filter: msg => msg.author.id === message.author.id,
    max:    1
  });

  const announcement = collected.first ();

  if (announcement) {
    const pings = [...meetup.rsvps,...meetup.maybes]
      .map (id => `<@${id}>`)
      .join (' ');

    await announcement.reply (`**☝️ Meetup Announcement from ${message.author.username}!**\n${pings}`);
  }
}