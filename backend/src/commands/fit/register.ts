import { match, __ } from 'ts-pattern';
import { channels } from '@sjbha/config';
import * as Command from '@sjbha/utils/Command';

// Bot

import { auth } from './commands/auth';
import { help } from './commands/help';
import { profile } from './commands/profile';
import { balance } from './commands/balance';
import { leaders } from './commands/leaders';
import { settings } from './commands/settings'

const fit = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.startsWith ('!fit'),
    Command.Filter.inChannel (channels.strava)
  ),

  callback: message =>
    match (Command.route (message))
    .with ('auth', () => auth(message))
    .with ('profile', () => profile(message))
    .with ('balance', () => balance(message))
    .with ('leaders', () => leaders(message))
    .with ('help', () => help (message))
    .with ('settings', () => message.reply ('Settings menu is available only in DMs'))
    .with (__.nullish, () => help (message))
    .run()
});

const settingsCommand = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.equals ('!fit settings'),
    Command.Filter.dmsOnly()
  ),

  callback: settings
});

// Admin Commands

import { post } from './admin/post';
import { list } from './admin/list';
import { remove } from './admin/remove';
import { promote } from './admin/promote';

const admin = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.equals ('$fit'),
    Command.Filter.inChannel (channels.bot_admin)
  ),

  callback: message =>
    match (Command.route (message))
    .with ('post', () => post(message))
    .with ('list', () => list(message))
    .with ('remove', () => remove(message))
    .with ('promote', () => promote(message))
    .run()
});

export const command = Command.combine (fit, settingsCommand, admin);

// Web API

import { authAccept } from './routes/auth-accept';
import { newWorkout } from './routes/activity-webhook';
import { verifyToken } from './routes/verify-token';

export const routes = [
  {
    method: 'GET',
    path: '/fit/accept',
    handler: authAccept
  },

  {
    method: 'GET',
    path: '/fit/api/webhook',
    handler: verifyToken
  },

  {
    method: 'POST',
    path: '/fit/api/webhook',
    handler: newWorkout
  }
];