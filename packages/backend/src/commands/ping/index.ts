import { onMessage } from '@sjbha/app';
import { reply, startsWith } from '@sjbha/utils/message-middleware';

onMessage (
  startsWith ('!ping'),
  reply ('Pong!')
);