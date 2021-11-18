import { Message } from 'discord.js';
import * as Render from '../features/RenderAnnouncement';
import * as Directory from '../features/Directory';

/**
 * Update the cache, in case they fall out of sync (or did some DB editing)
 */
export async function refresh (message: Message) : Promise<void> {
  Render.refresh ();
  Directory.queueRefresh ();
  message.reply ('Refreshing the meetups');
}