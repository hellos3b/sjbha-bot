import { env, Message$, Router } from '@sjbha/app';


// Commands

import { create } from './commands/create';
import { cancel } from './commands/cancel';
import { edit } from './commands/edit';

// This will restrict the meetup channel to a category
// for when labs mode is active (meaning we're testing it in only a few channels)
const labs_category = (env.IS_PRODUCTION)
  ? '896964395693924363'
  : '861815673591562280';

Message$
  .startsWith ('!meetup')
  .guildOnly ()
  .filter (message => message.channel.type === 'GUILD_TEXT' && message.channel.parentId === labs_category)
  .routes ({ 
    'create': create, 
    'cancel': cancel, 
    'edit':   edit,
    'empty':  msg => msg.reply ('Use this link to create a meetup: https://hellos3b.github.io/sjbha-bot/create-meetup/')
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

Directory.init ();
RSVP.init ();
EndMeetups.init ();


// Web API for editor
import { meetup } from './routes/meetup';

Router.get ('/meetup/{id}', meetup);