import { Message } from 'discord.js';
import * as Render from '../features/render';
import * as Directory from '../features/directory';

/**
 * Update the cache, in case they fall out of sync (or did some DB editing)
 */
export async function refresh (message: Message) : Promise<void> {
  Render.refresh ();
  Directory.runRefresh ();
  message.reply ('Refreshing the meetups');
}