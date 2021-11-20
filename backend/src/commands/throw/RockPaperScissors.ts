import * as Discord from 'discord.js';
import { DateTime } from 'luxon';
import { match } from 'ts-pattern';

import * as Format from '@sjbha/utils/Format'
import * as Game from './Game';
import * as Streaks from './Streak';

const COOLDOWN_MINUTES = 60;
export const rockPaperScissors = async (message: Discord.Message, handString: string) : Promise<void> => {
  const hand = {
    'rock':     Game.Hand.Rock,
    'scissors': Game.Hand.Scissors,
    'paper':    Game.Hand.Paper
  }[handString];

  if (hand === undefined) {
    message.reply ('Not a valid hand - Allowed options: "rock", "paper", "scissors"')
    return;
  }

  const streak = await Streaks.findOrCreate (message.author.id);
  
  if (streak.cooldown) {
    const cooldown = DateTime.fromISO (streak.cooldown);
    const diff = DateTime.local ().diff (cooldown, ['minutes']);

    if (diff.minutes < COOLDOWN_MINUTES) {
      const cooldownEnds = cooldown.plus ({ minutes: COOLDOWN_MINUTES });
        
      message.reply (`You're on cooldown! You can play again ${Format.time (cooldownEnds, Format.TimeFormat.Relative)}`);
      return;
    }
  }

  const bot = Game.randomHand ();
  const botHand = Game.toString (bot);

  switch (Game.checkResult (hand, bot)) {
    case Game.Result.Win: {
      const currentStreak = streak.currentStreak + 1;

      const update = await Streaks.update ({
        ...streak,
        bestStreak:    Math.max (streak.bestStreak, currentStreak),
        currentStreak: currentStreak
      });

      const stats =
        match (update.currentStreak)
        .with (update.bestStreak, () => 'tied with your best streak!')
        .when (s => s < update.bestStreak, () => `Best Streak: **${update.bestStreak}**`)
        .when (s => s > update.bestStreak, () => '⭐ New Personal Record!')
        .run ();

      message.reply (`🏆 Bot throws ${botHand}, you win!\nCurrent Streak: **${update.currentStreak}** ${stats}`);
      return;
    }
    
    case Game.Result.Lose: {
      const cooldown = DateTime.local ();

      await Streaks.update ({
        ...streak,
        currentStreak: 0,
        cooldown:      cooldown.toISO ()
      });

      const stats = 
        match (streak.currentStreak)
        .with (streak.bestStreak, () => `Finished with a **${streak.currentStreak}** game streak, tied with your best streak`)
        .when (s => s < streak.bestStreak, () =>  `Finished with a **${streak.currentStreak}** game streak (your best is still **${streak.bestStreak}**)`)
        .when (s => s > streak.bestStreak, () => `Finished with a **${streak.currentStreak}** game streak, congrats on the new record!`)
        .run ();

      const cooldownTarget = cooldown.plus ({ minutes: COOLDOWN_MINUTES });

      message.reply (`🌧️ Bot throws ${botHand}, you lost. ${stats}\nCan play again ${Format.time (cooldownTarget, Format.TimeFormat.Relative)}`);
      return;
    }

    case Game.Result.Tie: {
      message.reply (`🏳️ Bot also throws ${botHand}`);
      return;
    }
  }
} 