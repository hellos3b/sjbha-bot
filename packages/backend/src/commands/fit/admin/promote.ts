import { MessageHandler } from '@sjbha/app';
import { runPromotions } from '../features/weekly-promotions';

/**
 * Force the promotions to happen
 * This should only be used in a dev environment
 */
export const promote : MessageHandler = async message => {
  message.reply ('Beginning promotions');
  await runPromotions ();
}