import { env, Message$, Router } from '@sjbha/app';

// Commands

import { create } from './commands/create';
import { cancel } from './commands/cancel';
import { edit } from './commands/edit';
import { announce } from './commands/announce';

// This will restrict the meetup channel to a category
// for when labs mode is active (meaning we're testing it in only a few channels)
const labs_category = (env.IS_PRODUCTION)
  ? '896964395693924363'
  : '861815673591562280';

Message$
  .startsWith ('!meetup')
  .subscribe (async message => {
    const [, route] = message.content
      .replace (/\n/g, ' ')
      .split (' ');
 
    // Global Commands
    // commands you can use anywhere and are like singleton meetup commands
    if (message.channel.type === 'GUILD_TEXT' && message.channel.parentId === labs_category) {
      switch (route) {
        case 'create':
          return create (message);
        case 'help':
          return help (message);
        case undefined:
          return message.reply ('Click here to create a meetup: https://hellos3b.github.io/sjbha-bot/meetup');
      
        // old commands
        case 'edit':
          return message.reply ('Editing a meetup is now done inside the Meetup thread');
        case 'cancel':
          return message.reply ('Canceling a meetup is now done inside the Meetup thread');
        case 'mention':
          return message.reply ('Mentioning a meetup is now done inside the Meetup thread');
      }
    }
    // Threaded Commands
    // these commands are scoped to a specific meetup
    else if (message.channel.isThread ()) {
      switch (route) {
        case 'edit':
          return edit (message);
        case 'cancel':
          return cancel (message);
        case 'announce':
          return announce (message);
        case 'help':
          return help (message);
        case 'mention':
          return message.reply ('Mentioning a meetup has been changed to `!meetup announce`');
      }
    }
  });


// Admin Commands

import { refresh } from './admin/refresh';

Message$
  .startsWith ('$meetup')
  .adminOnly ()
  .routes ({ 
    'refresh': refresh
  });


// Services

import * as RSVP from './features/rsvps';
import * as Directory from './features/directory';
import * as EndMeetups from './features/end-meetups';
import * as Render from './features/render';
import * as KeepAlive from './features/keep-alive';

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


// Web API for editor

import { meetup } from './routes/meetup';
import { help } from './commands/help';

Router.get ('/meetup/{id}', meetup);