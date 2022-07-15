import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import * as Env from "@sjbha/app/env";

import { Command } from "./common/SlashCommand";

import Pong from "./commands/Pong";
import Tldr from "./commands/Tldr";
import Version from "./commands/Version";

const commands: Command[] = [
  Pong,
  Tldr,
  Version
];

export async function createSlashCommands(): Promise<Map<string, Command>> {
  const rest = new REST({ version: '9' }).setToken(Env.DISCORD_TOKEN);

  const commandMap = new Map<string, Command>();
  for (const command of commands)
    commandMap.set(command.name, command);

  const body = commands.map(i => i.toJson());

  try {
    await rest.put(
      Routes.applicationGuildCommands("530596459486380032", Env.SERVER_ID),
      { body }
    );

    return commandMap;
  } catch (e) {
    console.log("Had a problem setting up commands");
    console.error(e);

    return new Map();
  }
} 