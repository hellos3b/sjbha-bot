import * as Discord from "discord.js";
import * as Streak from "./Streak";

export const render = async (message: Discord.Message) : Promise<void> => {
   const streak = await Streak.findOrMake (message.author.id);
      
   if (streak.bestStreak === 0) {
      message.reply ("Welcome to Rock Paper Scissors! To play, pick between `!throw rock`, `!throw paper`, or `!throw scissors` and the bot will pick one randomly. Each win adds to a winstreak, losing resets. Use `!throw` to see your progress. Good luck!");
   }
   else {
      message.reply (`Best Streak: **${streak.bestStreak}**, Current streak: **${streak.currentStreak}**`);
   }
}; 