import { Message } from 'discord.js';

import * as db from '../db/meetups';
import * as Render from '../features/RenderAnnouncement';

/**
 * Update the cache, in case they fall out of sync (or did some DB editing)
 */
export async function add (message: Message) : Promise<void> {
  if (message.author.id !== '125829654421438464')
    return;

  if (!message.channel.isThread ())
    return;

  const meetup = await db.findOne ({ threadID: message.channelId });

  if (!meetup)
    return;

  const ids = message.mentions.users.map (u => u.id);

  await db.update ({
    ...meetup,
    rsvps: ids
  });

  await Render.refresh (message.client);

  const mentions = ids.map (id => `<@${id}>`).join (' ');
  message.reply (`The following users are being added to this meetup because they RSVP'd to the original post:\n${mentions}`);
  
  message.delete ();
}