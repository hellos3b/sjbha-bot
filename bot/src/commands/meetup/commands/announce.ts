import { Message } from "discord.js";
import { logger } from "../../../logger";
import * as db from "../db/meetups";

const log = logger ("meetup:announce");

const PINGS_PER_MENTION = 80;

// Notify all RSVPs about details of the meetup
export async function announce (message: Message) : Promise<void> {
   log.command (message);
  
   if (!message.channel.isThread ()) {
      log.debug ("Used outside of a thread, cancelling", { channelId: message.channelId });
      message.reply ("Meetup announcements have to be done in the thread the meetup is");
      return;
   }

   const meetup = await db.findOne ({ threadID: message.channelId });
  
   if (!meetup) {
      log.debug ("This thread is not a meetup thread", { thread: message.channel.name });
      message.reply ("Hm, it doesnt look like this thread is for a meetup");
      return;
   }

   if (message.author.id !== meetup.organizerID) {
      log.debug ("This person isnt in charge of the meetup", { organizer: meetup.organizerID });
      message.reply ("Sorry, only the organizer can publish an announcement");
      return;
   }

   await message.channel.send ("Alright, let everyone know what you want to say and I'll ping them");

   const collected = await message.channel.awaitMessages ({
      filter: msg => msg.author.id === message.author.id,
      max:    1
   });

   const announcement = collected.first ();

   if (announcement) {
      const rsvps = [...meetup.rsvps, ...meetup.maybes];
      const pings = rsvps.map (id => `<@${id}>`);

      for (let i = 0; i < pings.length; i += PINGS_PER_MENTION) {
         const group = pings
            .slice (i, i + PINGS_PER_MENTION)
            .join (" ");

         await announcement.reply (`**☝️ Meetup Announcement from ${message.author.username}!**\n${group}`);
      }

      log.debug ("Pings were set", { users: rsvps.length });
   }
   else {
      log.debug ("No announcement collected from user");
   }
}