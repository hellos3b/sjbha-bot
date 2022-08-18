open StdLib
open Discord

let command = SlashCommand.define (
   ~command = SlashCommand.make (
      ~name = "pong",
      ~description = "Check if the bot is alive",
      ()),

   ~interaction = int =>
      int->Interaction.respond (Text("Pong? From Rescript!", Public))->done
)