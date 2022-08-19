open StdLib

module StringOption = {
  type t

  @send external setName: (t, string) => t = "setName"
  @send external setDescription: (t, string) => t = "setDescription"
  @send external setRequired: (t, bool) => t = "setRequired"
}

// creating slash commands, along with some utils
module SubCommandBuilder = {
  type t

  @send external addStringOption: (t, StringOption.t => StringOption.t) => t = "addStringOption"
  @send external setName: (t, string) => t = "setName"
  @send external setDescription: (t, string) => t = "setDescription"
}

module SlashCommandBuilder = {
  type t

  // bindings
  @module("@discordjs/builders") @new external make: unit => t = "SlashCommandBuilder"
  @send external addSubCommand: (t, SubCommandBuilder.t => SubCommandBuilder.t) => t = "addSubcommand"
  @send external addStringOption: (t, StringOption.t => StringOption.t) => t = "addStringOption"
  @send external setName: (t, string) => t = "setName"
  @send external setDescription: (t, string) => t = "setDescription"
}

type interaction = Discord__Interaction.t

type t = {
   command: SlashCommandBuilder.t,
   interaction: interaction => unit
}

type subcommandFactory = SubCommandBuilder.t => SubCommandBuilder.t
type stringOptionFactory = StringOption.t => StringOption.t

let define = (~command: SlashCommandBuilder.t, ~interaction: interaction => unit) => {
   command: command,
   interaction: interaction
}

let make = (
   ~name: string, 
   ~description: string,
   ~subcommands: array<subcommandFactory>=[],
   ~options: array<stringOptionFactory>=[],
   () 
): SlashCommandBuilder.t => {
   let command = SlashCommandBuilder.make()
      -> SlashCommandBuilder.setName (name)
      -> SlashCommandBuilder.setDescription (description)

   subcommands->A.forEach (builder => 
      command
         -> SlashCommandBuilder.addSubCommand (builder)
         -> ignore)

   options->A.forEach (builder =>
      command
         -> SlashCommandBuilder.addStringOption (builder)
         -> ignore)

   command
}

let subcommand = (
   ~name: string,
   ~description: string,
   ~options: array<stringOptionFactory>=[],
   ()
): subcommandFactory => {
   subcmd => {
      subcmd
         -> SubCommandBuilder.setName (name)
         -> SubCommandBuilder.setDescription (description)
         -> ignore

      options->A.forEach (builder =>
         subcmd->SubCommandBuilder.addStringOption (builder)->ignore)

      subcmd
   }
}

let stringOption = (
   ~name: string,
   ~description: string,
   ~required: bool = false,
   ()
): stringOptionFactory => {
   option => {
      option
         -> StringOption.setName (name)
         -> StringOption.setDescription (description)
         -> StringOption.setRequired (required)
   }
}