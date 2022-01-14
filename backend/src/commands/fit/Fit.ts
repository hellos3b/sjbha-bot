import * as Discord from 'discord.js';
import { match, __ } from 'ts-pattern';
import { DiscordClient } from '@sjbha/app';
import { channels } from '@sjbha/server';
import * as Command from '@sjbha/utils/Command';
import * as Format from '@sjbha/utils/Format';

import * as Balance from './Balance';
import * as Settings from './Settings';
import * as Admin from './Admin';
import * as UserAuth from './UserAuth';
import * as UserProfile from './UserProfile';
import * as ActivityWebhook from './ActivityWebhook';
import * as Promotions from './Promotions';
import * as Leaders from './Leaders';

const { Filter } = Command;
const client = DiscordClient.getInstance ();

// todo: Update the README guide
// preface: 'Read this for an explanation on how the bot works with strava:\n<https://github.com/hellos3b/sjbha-bot/blob/ts-fit/src/plugins/fit/README.md>',
const help = Format.help ({
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

const fit = Command.makeFiltered ({
  filter: Filter.and (
    Filter.startsWith ('!fit'),
    Filter.inChannel (channels.strava)
  ),

  callback: message =>
    match (Command.route (message))
    .with ('auth', () => UserAuth.onBoarding (message))
    .with ('profile', () => UserProfile.render (message))
    .with ('balance', () => Balance.render (message))
    .with ('leaders', () => Leaders.leaderboard (message))
    .with ('help', () => message.channel.send (help))
    .with ('settings', () => message.reply ('Settings menu is available only in DMs'))
    .with (__.nullish, () => message.channel.send (help))
    .run ()
});

const settings = Command.makeFiltered ({
  filter: Filter.and (
    Filter.or (
      Filter.equals ('!fit settings'),
      Filter.equals ('!fit')
    ),
    Filter.dmsOnly ()
  ),

  callback: Settings.menu
});

// Admin Commands
const admin = Command.makeFiltered ({
  filter: Filter.and (
    Filter.startsWith ('$fit'),
    Filter.inChannel (channels.bot_admin)
  ),

  callback: message => 
    match (Command.route (message))
    .with ('post', () => Admin.post (message))
    .with ('list', () => Admin.listWorkouts (message))
    .with ('remove', () => Admin.remove (message))
    .with ('promote', () => Admin.promote (message))
    .otherwise (() => 
      message.channel.send (Format.help ({
        commandName: 'fit',
        description: 'Admin commands',
        usage:       '$fit <command>',
        commands:    {
          'post':    'Post a workout manually',
          'list':    'Show all recent workouts',
          'remove':  'Delete a workout that has been posted',
          'promote': '[dev] Run the weekly promotions now'
        }
      })))
});

export const command = Command.combine (fit, settings, admin);

// Web API
export const routes = [
  {
    method:  'GET',
    path:    '/fit/accept',
    handler: UserAuth.acceptAuthorization (client)
  },

  {
    method:  'GET',
    path:    '/fit/api/webhook',
    handler: UserAuth.acceptChallenge
  },

  {
    method:  'POST',
    path:    '/fit/api/webhook',
    handler: ActivityWebhook.handleEvent (client)
  }
];

export const startup = (client: Discord.Client) : void => {
  Promotions.startSchedule (client);
}