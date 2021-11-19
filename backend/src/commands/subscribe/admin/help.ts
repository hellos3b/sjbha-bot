import * as format from '@sjbha/utils/Format';
import { Message } from 'discord.js';

export async function help (message: Message) : Promise<void> {
  const help = format.help ({
    commandName: 'subscribe (admin)',
    description: 'Add or remove roles to the list of possible subscriptions',
    usage:       '$subscribe <command> [...options]',
    commands:    {
      'add <@role>':       'Add a new subscription',
      'remove <rolename>': 'Remove an existing subscription'
    }
  });

  message.channel.send (help);
}