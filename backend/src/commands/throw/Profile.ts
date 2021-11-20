import * as Discord from 'discord.js';
import * as Streak from './Streak';

export const profile = async (message: Discord.Message) : Promise<void> => {
  const streak = await Streak.findOrCreate (message.author.id);
      
  if (streak.bestStreak === 0) {
    message.reply ('Welcome to Rock Paper Scissors! To play, pick between `!rps rock`, `!rps paper`, or `!rps scissors` and the bot will pick one randomly. Each win adds to a winstreak, losing resets. Good luck!');
  }
  else {
    message.reply (`Best Streak: **${streak.bestStreak}**, Current streak: **${streak.currentStreak}**`);
  }
} 