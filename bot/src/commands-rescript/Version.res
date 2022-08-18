open StdLib
open Discord

@scope(("process", "env")) @val external version: string = "npm_package_version"

let command = SlashCommand.define (
   ~command = SlashCommand.make(
      ~name = "version",
      ~description = "Check which version the bot is currently running",
      ()),

   ~interaction = int =>
      int->Interaction.respond (Text(j`BoredBot $version`, Public))->done
)