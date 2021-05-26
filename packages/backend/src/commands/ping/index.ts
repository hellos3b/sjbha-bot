import {registerCommand, reply, startsWith} from '@sjbha/utils/command';

registerCommand (
  startsWith ('!ping'),
  reply ("Pong!")
);