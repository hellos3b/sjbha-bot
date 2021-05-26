import { registerHandler } from '@sjbha/app';
import {command, reply, startsWith} from '@sjbha/utils/command';

registerHandler (
  command (
    startsWith ('!ping'),
    reply ("Pong!")
  )
);