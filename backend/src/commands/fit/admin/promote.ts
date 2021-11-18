import { Message } from 'discord.js';
import { runPromotions } from '../features/weekly-promotions';

/**
 * Force the promotions to happen
 * This should only be used in a dev environment
 */
 export async function promote (message: Message) : Promise<void> {
  message.reply ('Beginning promotions');
  await runPromotions (message.client);
}