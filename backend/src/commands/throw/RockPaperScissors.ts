import { match } from 'ts-pattern';
import * as Discord from 'discord.js';
import { DateTime } from 'luxon';

import * as Format from '@sjbha/utils/Format';
import * as Streak from './Streak';

const COOLDOWN_MINUTES = 60;

type hand =
  | 'rock'
  | 'paper'
  | 'scissors'

type result =
  | 'win'
  | 'tie'
  | 'loss'

const hands : hand[] = ['rock', 'paper', 'scissors'];

const checkResult = (a: hand, b: hand) : result => {
  const wins = (a2: hand, b2: hand) =>
    match ([a2, b2])
    .with (['rock', 'scissors'], () => true)
    .with (['paper', 'rock'], () => true)
    .with (['scissors', 'paper'], () => true)
    .otherwise (() => false);

  return (wins (a, b)) ? 'win'
    : (wins (b, a)) ? 'loss'
    : 'tie';
}

const randomHand = ()  =>
  hands[Math.floor (Math.random ()*3)];

const validHand = (str: hand | string) : str is hand =>
  hands.includes (<hand>str);

export const play = async (message: Discord.Message, hand: string) : Promise<void> => {
  if (!validHand (hand)) {
    message.reply ('Not a valid hand - Allowed options: "rock", "paper", "scissors"')
    return;
  }

  const streak = await Streak.findOrMake (message.author.id);
  
  if (streak.cooldown) {
    const cooldown = DateTime.fromISO (streak.cooldown);
    const diff = DateTime.local ().diff (cooldown, ['minutes']);

    if (diff.minutes < COOLDOWN_MINUTES) {
      const cooldownEnds = cooldown.plus ({ minutes: COOLDOWN_MINUTES });
        
      message.reply (`You're on cooldown! You can play again ${Format.time (cooldownEnds, Format.TimeFormat.Relative)}`);
      return;
    }
  }

  const bot = randomHand ();

  switch (checkResult (hand, bot)) {
    case 'win': {
      const currentStreak = streak.currentStreak + 1;

      const update = await Streak.update ({
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

      message.reply (`🏆 Bot throws ${bot}, you win!\nCurrent Streak: **${update.currentStreak}** ${stats}`);
      return;
    }
    
    case 'loss': {
      const cooldown = DateTime.local ();

      await Streak.update ({
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

      message.reply (`🌧️ Bot throws ${bot}, you lost. ${stats}\nCan play again ${Format.time (cooldownTarget, Format.TimeFormat.Relative)}`);
      return;
    }

    case 'tie': {
      message.reply (`🏳️ Bot also throws ${bot}`);
      return;
    }
  }
} 
