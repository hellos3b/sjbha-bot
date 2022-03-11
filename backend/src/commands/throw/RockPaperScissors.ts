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

const hands : hand[] = ['rock', 'paper', 'scissors'];

const checkResult = (a: hand, b: hand) : Streak.result => {
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

const randomFrom = <T>(arr: T[]) : T =>
  arr[Math.floor (Math.random ()*arr.length)];

const validHand = (str: hand | string) : str is hand =>
  hands.includes (<hand>str);

const handEmoji = (hand: hand) : string => ({
  'rock':     '✊',
  'scissors': '✌️',
  'paper':    '✋'
})[hand];

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
        
      message.reply (`Cooldown: ${Format.time (cooldownEnds, Format.TimeFormat.Relative)}`);
      return;
    }
  }

  const bot = randomFrom (hands);

  switch (checkResult (hand, bot)) {
    case 'win': {
      const currentStreak = streak.currentStreak + 1;

      const update = await Streak.update ({
        ...streak,
        bestStreak:    Math.max (streak.bestStreak, currentStreak),
        currentStreak: currentStreak,
        history:       [...streak.history, 'win']
      });

      const prString = update.currentStreak > streak.bestStreak ? '\n🎉 Personal Best' : '';
      const player = randomFrom (['😏', '😁', '🙂']);

      message.reply (`${player}${handEmoji (hand)} 🏆 ${handEmoji (bot)}🤖\nStreak: **${update.currentStreak}** • Best: **${update.bestStreak}** ${prString}`);
      return;
    }
    
    case 'loss': {
      const cooldown = DateTime.local ();
      const history = [...streak.history, 'loss'];

      await Streak.update ({
        ...streak,
        currentStreak: 0,
        cooldown:      cooldown.toISO (),
        history:       []
      });

      const player = randomFrom (['😭', '🥲', '☹️']);
      const cooldownTarget = cooldown.plus ({ minutes: COOLDOWN_MINUTES });
      const emojiHistory = history.map (h => ({
        'win':  '🏆',
        'tie':  '🏳️',
        'loss': '💥'
      })[h]).join ('');

      const victoryScreen = `Streak: **${streak.currentStreak}**\n\n${emojiHistory}`;

      message.reply (`${player}${handEmoji (hand)} 💥 ${handEmoji (bot)}🤖\n${victoryScreen}\nCooldown: ${Format.time (cooldownTarget, Format.TimeFormat.Relative)}`);
      return;
    }

    case 'tie': {
      await Streak.update ({
        ...streak,
        history: [...streak.history, 'tie']
      });

      const player = randomFrom (['😐', '😯']);
      message.reply (`${player}${handEmoji (hand)} 🏳️ ${handEmoji (bot)}🤖\nStreak: **${streak.currentStreak}** • Best: **${streak.bestStreak}** `);
      return;
    }
  }
} 
