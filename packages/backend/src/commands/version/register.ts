import { onMessage } from '@sjbha/app';
import { reply, startsWith } from '@sjbha/utils/message-middleware';
import { env } from '@sjbha/app';

onMessage (
  startsWith ('!version'),
  reply (`BoredBot v${env.VERSION}`)
);