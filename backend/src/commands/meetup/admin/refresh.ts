import { Message } from 'discord.js';
import * as db from '../db/meetups';

/**
 * Update the cache, in case they fall out of sync (or did some DB editing)
 */
export async function refresh (message: Message) : Promise<void> {
  db.events.emit ('edited');
  message.reply ('Emitted the refresh event');
}