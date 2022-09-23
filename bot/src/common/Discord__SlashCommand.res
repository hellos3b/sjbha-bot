module StringOption = {
  type t
  type choice = {name: string, value: string}
  @send @variadic external addChoices: (t, array<choice>) => t = "addChoices"
  @send external setName: (t, string) => t = "setName"
  @send external setDescription: (t, string) => t = "setDescription"
  @send external setRequired: (t, bool) => t = "setRequired"
}

module UserOption = {
  type t
  @send external setName: (t, string) => t = "setName"
  @send external setDescription: (t, string) => t = "setDescription"
  @send external setRequired: (t, bool) => t = "setRequired"
}

// creating slash commands, along with some utils
module SubCommand = {
  type t
  @send external addStringOption: (t, StringOption.t => StringOption.t) => t = "addStringOption"
  @send external setName: (t, string) => t = "setName"
  @send external setDescription: (t, string) => t = "setDescription"
  @send external addUserOption: (t, UserOption.t => UserOption.t) => t = "addUserOption"
}

type t

@module("@discordjs/builders") @new external make: unit => t = "SlashCommandBuilder"
@send external addSubCommand: (t, SubCommand.t => SubCommand.t) => t = "addSubcommand"
@send external addStringOption: (t, StringOption.t => StringOption.t) => t = "addStringOption"
@send external addUserOption: (t, UserOption.t => UserOption.t) => t = "addUserOption"
@send external setName: (t, string) => t = "setName"
@send external setDescription: (t, string) => t = "setDescription"
@send external setDefaultMemberPermissions: (t, int) => t = "setDefaultMemberPermissions"

type interaction = Discord__Interaction.t

type config = {
  command: t,
  execute: interaction => unit,
}

@obj external define: (~command: t, ~interaction: interaction => unit) => config = ""