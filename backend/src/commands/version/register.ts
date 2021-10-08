import { Message$ } from '@sjbha/app';
import { env } from '@sjbha/app';

Message$
  .startsWith ('!version')
  .replyWith (`BoredBot v${env.VERSION}`);