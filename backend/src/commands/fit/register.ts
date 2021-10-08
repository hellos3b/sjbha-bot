import { router, Message$ } from '@sjbha/app';
import { channels } from '@sjbha/config';

// Bot

import { auth } from './commands/auth';
import { help } from './commands/help';
import { profile } from './commands/profile';
import { balance } from './commands/balance';
import { leaders } from './commands/leaders';
import { settings } from './commands/settings'

Message$
  .startsWith ('!fit')
  .restrictToChannel (channels.strava)
  .routes ({
    auth:     auth,
    profile:  profile,
    balance:  balance,
    leaders:  leaders,
    help:     help,
    empty:    help,
    settings: message => message.reply ('Settings menu is available only in DMs')
  });


Message$
  .equals ('!fit settings')
  .dmsOnly ()
  .subscribe (settings);

// Admin Commands

import { post } from './admin/post';
import { list } from './admin/list';
import { remove } from './admin/remove';
import { promote } from './admin/promote';

Message$
  .startsWith ('$fit')
  .adminOnly ()
  .routes ({
    post:    post,
    list:    list,
    remove:  remove,
    promote: promote
  });

// Web API

import { authAccept } from './routes/auth-accept';
import { newWorkout } from './routes/activity-webhook';

router.get ('/fit/accept', authAccept);
router.post ('/fit/api/webhook', newWorkout);