open StdLib
open Discord

let command = Command.config(
   ~command = Command.make (
      ~name = "pong",
      ~description = "check if the bot is alive"
   ),

   ~interaction = int =>
      int->Interaction.reply ("Pong? From Rescript!")->done
)