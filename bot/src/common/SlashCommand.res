open StdLib
open Discord

type t = {
   command: SlashCommandBuilder.t,
   interaction: Interaction.t => unit
}

type subcommandFactory = SubCommandBuilder.t => SubCommandBuilder.t
type stringOptionFactory = StringOption.t => StringOption.t

let define = (~command: SlashCommandBuilder.t, ~interaction: Interaction.t => unit) => {
   command: command,
   interaction: interaction
}

let make = (
   ~name: string, 
   ~description: string,
   ~subcommands: array<subcommandFactory>=[],
   () 
): SlashCommandBuilder.t => {
   let command = SlashCommandBuilder.make()
      -> SlashCommandBuilder.setName (name)
      -> SlashCommandBuilder.setDescription (description)

   subcommands->A.forEach (builder => 
      command
         -> SlashCommandBuilder.addSubCommand (builder)
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
         subcmd
            -> SubCommandBuilder.addStringOption (builder)
            -> ignore)

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