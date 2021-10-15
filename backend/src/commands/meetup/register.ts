import { env, Message$, Router } from '@sjbha/app';
import * as db from './db/meetups';

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
        case 'message':
          return message.reply ('Mentioning a meetup has been changed to `!meetup announce <Message>`');
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

import * as RSVP from './features/rsvps';
import * as Directory from './features/directory';
import * as EndMeetups from './features/end-meetups';
import * as Render from './features/render';

Render.init ();
RSVP.init ();
Directory.init ();
EndMeetups.init ();


// Web API for editor
import { meetup } from './routes/meetup';

Router.get ('/meetup/{id}', meetup);