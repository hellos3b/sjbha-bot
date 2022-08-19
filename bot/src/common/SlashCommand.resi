type t
type subcommandFactory
type stringOptionFactory

let define: (
  ~command: Discord.SlashCommandBuilder.t,
  ~interaction: Discord.Interaction.t => unit,
) => t

let make: (
  ~name: string,
  ~description: string,
  ~subcommands: array<subcommandFactory>=?,
  ~options: array<stringOptionFactory>=?,
  unit,
) => Discord.SlashCommandBuilder.t

let subcommand: (
  ~name: string,
  ~description: string,
  ~options: array<stringOptionFactory>=?,
  unit,
) => subcommandFactory

let stringOption: (
  ~name: string,
  ~description: string,
  ~required: bool=?,
  unit,
) => stringOptionFactory
