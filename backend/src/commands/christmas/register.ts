import { onMessage } from '@sjbha/app';
import { startsWith } from '@sjbha/utils/message-middleware';

import { christmas } from './christmas';

onMessage (
  startsWith ('!christmas'),
  christmas
);