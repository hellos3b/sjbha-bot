import { onMessage, router } from '@sjbha/app';
import { routes, startsWith } from '@sjbha/utils/message-middleware';

// Bot

import { auth } from './commands/auth';
import { help } from './commands/help';
import { profile } from './commands/profile';
import { balance } from './commands/balance';
import { leaders } from './commands/leaders';

onMessage (
  startsWith ('!fit'),
  routes ({
    auth:    auth,
    profile: profile,
    balance: balance,
    leaders: leaders,
    help:    help,
    empty:   help
  })
);

// Admin Commands

import { post } from './admin/post';
import { list } from './admin/list';
import { remove } from './admin/remove';

onMessage (
  startsWith ('$fit'),
  routes ({
    post:   post,
    list:   list,
    remove: remove
  })
);

// Web API

import { authAccept } from './routes/auth-accept';
import { newWorkout } from './routes/activity-webhook';

router.get ('/fit/accept', authAccept);
router.get ('/fit/webhook', newWorkout);