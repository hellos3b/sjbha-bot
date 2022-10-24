import { differenceInDays } from "date-fns";
import { ChatInputCommandInteraction, InteractionReplyOptions } from "discord.js";
import { interactionFailed } from "../errors";

const festivize = (message: string) => `🎄☃️☃️🎄🎁 ${message} 🎁🎄☃️☃️🎄`;

const pluralize = (word: string, count: number) =>
   (count === 1)
      ? word
      : word + "S";

const daysUntilChristmas = (now: Date) => {
   const year = now.getFullYear ();
   const month = now.getMonth ();
   const date = now.getDate ();

   const xmasYear = 
      (month === 11 && date > 25)
         ? year + 1
         : year;

   const christmas = new Date (xmasYear, 11, 25, now.getHours (), now.getMinutes () + 1);
   return differenceInDays (christmas, now);
};

const makeReply = (days: number): InteractionReplyOptions => ({
   content: (days === 0)
      ? festivize ("!!TODAY IS CHRITMAS!!")
      : `ONLY ${days} ${pluralize ("DAY", days)} UNTIL CHRISTMAS!!`
});

export const christmas = (interaction: ChatInputCommandInteraction): void => {
   const daysUntil = daysUntilChristmas (new Date ());

   interaction
      .reply (makeReply (daysUntil))
      .catch (interactionFailed);
};