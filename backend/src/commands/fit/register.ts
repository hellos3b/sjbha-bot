import * as Discord from 'discord.js';
import { match, __ } from 'ts-pattern';
import { DiscordClient } from '@sjbha/app';
import { channels } from '@sjbha/config';
import * as Command from '@sjbha/utils/Command';

import { auth } from './commands/auth';
import { help } from './commands/help';
import { profile } from './commands/profile';
import { balance } from './commands/balance';
import { leaders } from './commands/leaders';
import { settings } from './commands/settings'

import { post } from './admin/post';
import { list } from './admin/list';
import { remove } from './admin/remove';
import { promote } from './admin/promote';

import { authAccept } from './routes/auth-accept';
import { newWorkout } from './routes/activity-webhook';
import { verifyToken } from './routes/verify-token';

import * as WeeklyPromotions from './features/weekly-promotions';

const client = DiscordClient.getInstance ();

const fit = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.startsWith ('!fit'),
    Command.Filter.inChannel (channels.strava)
  ),

  callback: message =>
    match (Command.route (message))
    .with ('auth', () => auth (message))
    .with ('profile', () => profile (message))
    .with ('balance', () => balance (message))
    .with ('leaders', () => leaders (message))
    .with ('help', () => help (message))
    .with ('settings', () => message.reply ('Settings menu is available only in DMs'))
    .with (__.nullish, () => help (message))
    .run ()
});

const settingsCommand = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.equals ('!fit settings'),
    Command.Filter.dmsOnly ()
  ),

  callback: settings
});

// Admin Commands
const admin = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.equals ('$fit'),
    Command.Filter.inChannel (channels.bot_admin)
  ),

  callback: message =>
    match (Command.route (message))
    .with ('post', () => post (message))
    .with ('list', () => list (message))
    .with ('remove', () => remove (message))
    .with ('promote', () => promote (message))
    .run ()
});

export const command = Command.combine (fit, settingsCommand, admin);

// Web API

export const routes = [
  {
    method:  'GET',
    path:    '/fit/accept',
    handler: authAccept
  },

  {
    method:  'GET',
    path:    '/fit/api/webhook',
    handler: verifyToken
  },

  {
    method:  'POST',
    path:    '/fit/api/webhook',
    handler: newWorkout (client)
  }
];

export const startup = (client: Discord.Client) : void => {
  WeeklyPromotions.startSchedule (client);
}