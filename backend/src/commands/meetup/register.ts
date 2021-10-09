import { Message$, Router } from '@sjbha/app';


// Commands

import { create } from './commands/create';
import { cancel } from './commands/cancel';
import { edit } from './commands/edit';

Message$
  .startsWith ('!meetup')
  .routes ({ 
    'create': create, 
    'cancel': cancel, 
    'edit':   edit 
  });


// Admin Commands

// import { refresh } from './admin/refresh';

// Message$
//   .startsWith ('$meetup')
//   .adminOnly ()
//   .routes ({ 
//     'refresh': refresh
//   });

import * as RSVP from './features/rsvps';

RSVP.init ();


// Web API for editor
import { meetup } from './routes/meetup';

Router.get ('/meetup/{id}', meetup);