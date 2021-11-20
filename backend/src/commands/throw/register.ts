import { channels } from '@sjbha/config';
import * as Command from '@sjbha/utils/Command';
import { match, select, __ } from 'ts-pattern';

import { profile } from './Profile';
import { rockPaperScissors } from './RockPaperScissors';

// Rock paper scissors!
export const command = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.startsWith ('!throw'),
    Command.Filter.inChannel (channels.showdown)
  ),

  callback: async message =>
    match (Command.route (message))
    .with (__.nullish, () => profile (message))
    .with (select (), hand => rockPaperScissors (message, hand || ''))
    .run ()
})