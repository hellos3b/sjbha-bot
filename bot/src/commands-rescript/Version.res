open StdLib
open Discord

@scope(("process", "env")) @val external version: string = "npm_package_version"

let command = Command.config(
   ~command = Command.make (
      ~name = "version",
      ~description = "Check which version the bot is currently running"
   ),

   ~interaction = int =>
      int->Interaction.reply (j`BoredBot $version`)->done
)