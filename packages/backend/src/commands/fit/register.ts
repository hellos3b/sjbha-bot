import { onMessage, router } from '@sjbha/app';
import { routes, startsWith } from '@sjbha/utils/message-middleware';

// Bot

import { auth } from './commands/auth';
import { help } from './commands/help';
import { profile } from './commands/profile';

onMessage (
  startsWith ('!fit'),
  routes ({
    auth:    auth,
    profile: profile,
    empty:   help
  })
);

// Admin Commands

import { post } from './admin/post';

onMessage (
  startsWith ('$fit'),
  routes ({
    post: post
  })
);

// Web API

import { authAccept } from './routes/auth-accept';
import { newWorkout } from './routes/activity-webhook';

router.get ('/fit/accept', authAccept);
router.get ('/fit/webhook', newWorkout);