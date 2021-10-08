import * as format from '@sjbha/utils/string-formatting';
import { Message } from 'discord.js';

/**
 * Show a help string 
 */
 export async function help (message: Message) : Promise<void> {
  const help = format.help ({
    // todo: Update the README guide
    // preface:     'Read this for an explanation on how the bot works with strava:\n<https://github.com/hellos3b/sjbha-bot/blob/ts-fit/src/plugins/fit/README.md>',
    commandName: 'fit',
    description: 'Integrate @BoredBot with your strava, gain EXP for being consistent',
    usage:       '!fit <command>',
    commands:    {
      'auth':    'Set up your strava account with the bot',
      'profile': 'View your progress and stats',
      'leaders': 'View the top 2 exp earners for each activity type',
      'balance': 'Check how balanced your XP'
    }
  });

  message.channel.send (help);
}