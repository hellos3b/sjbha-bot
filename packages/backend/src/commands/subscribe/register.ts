import { onMessage } from '@sjbha/app';
import { adminOnly, routes, startsWith } from '@sjbha/utils/message-middleware';

// Subscriptions

import { list } from './commands/list';
import { subscribe } from './commands/subscribe';
import { unsubscribe } from './commands/unsubscribe';

onMessage (
  startsWith ('!subscribe'),
  routes ({ 
    empty: list,
    '*':   subscribe
  })
);

onMessage (
  startsWith ('!unsubscribe'),
  unsubscribe
);


// Admin Commands

import { add } from './admin/add-tag';
import { remove } from './admin/remove-tag';
import { help } from './admin/help';

onMessage (
  startsWith ('$subscribe'),
  adminOnly (),
  routes ({
    add, 
    remove,
    '*': help
  })
);
