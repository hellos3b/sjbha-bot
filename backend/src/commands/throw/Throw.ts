import { channels } from '@sjbha/server';
import * as Command from '@sjbha/utils/Command';
import { match, __ } from 'ts-pattern';

import * as Profile from './Profile';
import * as RockPaperScissors from './RockPaperScissors';

// Rock paper scissors!
export const command = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.startsWith ('!throw'),
    Command.Filter.inChannel (channels.showdown)
  ),

  callback: async message =>
    match (Command.route (message))
    .with (__.nullish, () => Profile.render (message))
    .otherwise (hand => RockPaperScissors.play (message, hand ?? ''))
})