import { Message$ } from '@sjbha/app';
import { christmas } from './christmas';

Message$
  .startsWith ('!christmas')
  .subscribe (christmas);