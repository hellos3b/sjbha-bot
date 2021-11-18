import { Message } from 'discord.js';
import { DateTime } from 'luxon';

import * as Render from '../features/RenderAnnouncement';
import * as Directory from '../features/Directory';

/**
 * Update the cache, in case they fall out of sync (or did some DB editing)
 */
export async function refresh (message: Message) : Promise<void> {
  Render.refresh (message.client);
  Directory.refresh (message.client, DateTime.now ());

  message.reply ('Refreshing the meetups');
}