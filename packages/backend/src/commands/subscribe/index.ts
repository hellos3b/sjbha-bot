import { admin, registerCommand, routes, startsWith } from '@sjbha/utils/command';

import { list } from './features/list';
import { add } from './features/add-tag';
import { remove } from './features/remove-tag';
import { subscribe } from './features/subscribe';
import { unsubscribe } from './features/unsubscribe';

registerCommand (
  startsWith ('!subscribe'),
  routes ({
    add:     admin (add),
    remove:  admin (remove),
    default: subscribe,
    __:      list
  })
);

registerCommand (
  startsWith ('!unsubscribe'),
  unsubscribe
);