open StdLib
open Discord

@scope(("process", "env")) @val external version: string = "npm_package_version"

let command = SlashCommand.define (
   ~command = SlashCommand.make()
      -> SlashCommand.setName ("version")
      -> SlashCommand.setDescription ("Check which version of the bot is running"),

   ~interaction = int =>
      int->Interaction.respond (Text(j`BoredBot $version`, Public))->done
)