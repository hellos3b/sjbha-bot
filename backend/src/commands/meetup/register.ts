import { env } from '@sjbha/app';
import * as Command from '@sjbha/utils/Command';
import * as Discord from 'discord.js';
import { match, __ } from 'ts-pattern';
import { channels } from '@sjbha/config';

import { create } from './commands/create';
import { cancel } from './commands/cancel';
import { edit } from './commands/edit';
import { announce } from './commands/announce';
import { refresh } from './admin/refresh';

// This will restrict the meetup channel to a category
// for when labs mode is active (meaning we're testing it in only a few channels)
const labs_category = (env.IS_PRODUCTION)
  ? '896964395693924363'
  : '861815673591562280';

// Filter helpers
const channelIsInLabs = (message: Discord.Message) => 
  message.channel.type === 'GUILD_TEXT' && message.channel.parentId === labs_category;

const messageIsInThread = (message: Discord.Message) => 
  message.channel.isThread ();

const meetupGlobal = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.startsWith ('!meetup'),
    channelIsInLabs
  ),

  callback: message => 
    match (Command.route (message))
    .with ('create', () => create (message))
    .with ('help', () => help (message))
    .with ('edit', () => message.reply ('Editing a meetup is now done inside the Meetup thread'))
    .with ('cancel', () => message.reply ('Canceling a meetup is now done inside the Meetup thread'))
    .with ('mention', () => message.reply ('Mentioning a meetup is now done inside the Meetup thread'))
    .with (__.nullish, () => message.reply ('Click here to create a meetup: https://hellos3b.github.io/sjbha-bot/meetup'))
    .run ()
});

const meetupManage = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.startsWith ('!meetup'),
    messageIsInThread
  ),

  callback: message =>
    match (Command.route (message))
    .with ('edit', () => edit (message))
    .with ('cancel', () => cancel (message))
    .with ('announce', () => announce (message))
    .with ('help', () => help (message))
    .with ('mention', () => message.reply ('Mentioning a meetup has been changed to `!meetup announce`'))
    .run ()
})

const admin = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.startsWith ('$meetup'),
    Command.Filter.inChannel (channels.bot_admin)
  ),

  callback: message =>
    match (Command.route (message))
    .with ('refresh', () => refresh (message))
    .run ()
});

export const command = Command.combine (
  meetupGlobal,
  meetupManage, 
  admin
);

// Services

import * as RSVP from './features/rsvps';
import * as Directory from './features/directory';
import * as EndMeetups from './features/end-meetups';
import * as Render from './features/render';
import * as KeepAlive from './features/keep-alive';

export const startup = (client: Discord.Client) : void => {
  // Keeps the announcement Embed up to date
  Render.init ();

  // Listen to RSVP buttons and update meetup
  RSVP.init ();

  // Keeps a compact view in #meetups-directory up to date
  Directory.init ();

  // Auto end meetups after a certain period
  EndMeetups.init ();

  // Keeps threads open while a meetup is live
  KeepAlive.init ();
}


// Web API for editor

import { meetup } from './routes/meetup';
import { help } from './commands/help';

export const routes = [
  {
    method:  'GET',
    path:    '/meetup/{id}',
    handler: meetup
  }
];