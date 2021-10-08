import { Message$, router } from '@sjbha/app';


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

import { refresh } from './admin/refresh';

Message$
  .startsWith ('$meetup')
  .adminOnly ()
  .routes ({ 
    'refresh': refresh
  });


// public API

import { meetup } from './routes/meetup';

router.get ('/meetup/{id}', meetup);