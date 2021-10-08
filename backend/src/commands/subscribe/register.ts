import { Message$ } from '@sjbha/app';

// Subscriptions

import { list } from './commands/list';
import { subscribe } from './commands/subscribe';
import { unsubscribe } from './commands/unsubscribe';

Message$
  .startsWith ('!subscribe')
  .routes ({
    empty: list,
    '*':   subscribe
  });
  
Message$
  .startsWith ('!unsubscribe')
  .subscribe (unsubscribe);


// Admin Commands

import { add } from './admin/add-tag';
import { remove } from './admin/remove-tag';
import { help } from './admin/help';

Message$
  .startsWith ('$subscribe')
  .adminOnly ()
  .routes ({
    'add':    add, 
    'remove': remove,
    '*':      help
  });