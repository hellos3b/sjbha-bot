import * as Command from '@sjbha/utils/Command';
import { match, __ } from 'ts-pattern';
import { channels } from '@sjbha/config';

import { list } from './commands/list';
import { subscribe } from './commands/subscribe';
import { unsubscribe } from './commands/unsubscribe';
import { add } from './admin/add-tag';
import { remove } from './admin/remove-tag';
import { help } from './admin/help';

const sub = Command.makeFiltered ({
  filter:   Command.Filter.startsWith ('!subscribe'),
  callback: message => 
    match (Command.route (message))
    .with (__.nullish, () => list (message))
    .otherwise (() => subscribe (message))
});

const unsub = Command.makeFiltered ({
  filter:   Command.Filter.startsWith ('!unsubscribe'),
  callback: unsubscribe
});

const admin = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.startsWith ('$subscribe'),
    Command.Filter.inChannel (channels.bot_admin)
  ),

  callback: message => 
    match (Command.route (message))
    .with ('add', () => add (message))
    .with ('remove', () => remove (message))
    .otherwise (() => help (message))
});

export const command = Command.combine (sub, unsub, admin);