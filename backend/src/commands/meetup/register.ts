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
  .subscribe (message => {
    const [, route] = message.content
      .replace (/\n/g, ' ')
      .split (' ');
 
    const isGuild = (message.channel.type === 'GUILD_TEXT' && message.channel.parentId === labs_category);
    const isThread = message.channel.isThread ();

    switch (true) {
      case (isGuild && route === 'create'):
        return create (message);

      case (isGuild):
        return message.reply (`Use this link to create a meetup: ${env.UI_HOSTNAME}/meetup`);

      case (isThread && route === 'edit'):
        return edit (message);

      case (isThread && route === 'cancel'):
        return cancel (message);
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

Directory.init ();
RSVP.init ();
EndMeetups.init ();


// Web API for editor
import { meetup } from './routes/meetup';

Router.get ('/meetup/{id}', meetup);