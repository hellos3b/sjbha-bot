import { Message$ } from '@sjbha/app';

Message$
  .startsWith ('!pong')
  .replyWith ('Ping?');