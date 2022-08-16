import { type CommandInteraction, CacheType } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as Env from '@sjbha/app/env';
import { Log } from './app';

import { Command } from './common/SlashCommand';

import * as MainRescript from './MainRescript.bs';
import * as ManifestRescript from './ManifestRescript.bs';
import Tldr from './commands/Tldr';
import { SlashCommandBuilder } from '@discordjs/builders';

type execute = (i: CommandInteraction<CacheType>) => void;
type recommand = {
  command: SlashCommandBuilder,
  interaction: execute
}

const log = Log.make ('manifest');
const commands: Command[] = [
  Tldr
];

const recommands: recommand[] = 
  ManifestRescript.commandList;

export async function createSlashCommands(): Promise<Map<string, execute>> {
  const rest = new REST ({ version: '9' }).setToken (Env.DISCORD_TOKEN);

  const commandMap = new Map<string, execute> ();
  for (const command of commands)
    commandMap.set (command.name, i => command.execute (i));

  for (const command of recommands)
    commandMap.set (command.command.name, command.interaction)

  const body = [
    ...commands.map (it => it.toJson ()),
    ...recommands.map (it => it.command.toJSON ())
  ];

  log.debug ('slash command list', { 
    commands: [...commandMap.keys ()]
  });

  try {
    await rest.put (
      Routes.applicationGuildCommands (Env.DISCORD_CLIENT_ID, Env.SERVER_ID),
      { body }
    );

    return commandMap;
  }
  catch (e) {
    log.error ('Had a problem setting up commands', e);

    return new Map ();
  }
} 