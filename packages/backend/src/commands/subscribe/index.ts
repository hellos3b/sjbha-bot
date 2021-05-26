import { onMessage } from '@sjbha/app';
import { adminOnly, routes, startsWith } from '@sjbha/utils/message-middleware';

import { list } from './features/list';
import { add } from './features/add-tag';
import { remove } from './features/remove-tag';
import { adminHelp } from './features/admin-help';
import { subscribe } from './features/subscribe';
import { unsubscribe } from './features/unsubscribe';

onMessage (
  startsWith ('$subscribe'),
  adminOnly (),
  routes ({
    add, 
    remove,
    '*': adminHelp
  })
)

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