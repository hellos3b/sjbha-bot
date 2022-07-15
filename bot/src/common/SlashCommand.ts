// I hate builder patterns, so opting to create an easier one 

import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export interface Executable {
  readonly name: string;
  execute(interaction: CommandInteraction): unknown;
}

interface ListData {
  name: string;
  description?: string;
}

interface TakesParameters {
  options?: Option[];
}

interface IsRootCommand {
  subcommands?: SubCommand[];
}

interface OptionData {
  required?: boolean;
}

type CommandConfig = ListData & TakesParameters & Executable;
type RootCommandConfig = IsRootCommand & TakesParameters & ListData & Executable;
type OptionConfig = ListData & OptionData;

export class SubCommand implements Executable {
  private constructor(
    private readonly config: CommandConfig
  ) { }

  static make = (config: CommandConfig) => new SubCommand(config);

  get name() { return this.config.name; }

  apply = (builder: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder => {
    builder.setName(this.config.name);
    builder.setDescription(this.config.description ?? "");
    (this.config.options ?? []).forEach(f => {
      builder.addStringOption(opt => f.apply(opt));
    });
    return builder;
  }

  matches = (interaction: CommandInteraction): boolean =>
    interaction.options.getSubcommand() === this.config.name;

  execute = (interaction: CommandInteraction): unknown =>
    this.config.execute(interaction);
}

export class Command implements Executable {
  constructor(
    private readonly config: RootCommandConfig
  ) { }

  static make = (config: RootCommandConfig) => new Command(config);

  get name() { return this.config.name; }

  toJson = () => {
    const command = new SlashCommandBuilder();
    command.setName(this.config.name);
    command.setDescription(this.config.description ?? "");
    (this.config.subcommands ?? []).forEach(f => {
      command.addSubcommand(sub => f.apply(sub));
    });
    (this.config.options ?? []).forEach(f => {
      command.addStringOption(sub => f.apply(sub));
    });
    return command.toJSON();
  }

  matches = (interaction: CommandInteraction): boolean =>
    interaction.commandName === this.config.name;

  execute = (interaction: CommandInteraction): unknown =>
    this.config.execute(interaction);
}

export class Option {
  private constructor(
    private readonly config: OptionConfig
  ) { }

  static make = (config: OptionConfig) => new Option(config);

  apply = (builder: SlashCommandStringOption): SlashCommandStringOption => {
    builder.setName(this.config.name);
    builder.setDescription(this.config.description ?? "");
    builder.setRequired(this.config.required ?? false);
    return builder;
  }

  get = (interaction: CommandInteraction): string | null =>
    interaction.options.getString(this.config.name);

  getExn = (interaction: CommandInteraction): string => {
    const value = this.get(interaction);
    if (!value) throw new Error(`Option value was undefined: '${this.config.name}'`);
    return value;
  }
}
