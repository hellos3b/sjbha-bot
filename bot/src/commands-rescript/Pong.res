open StdLib
open Discord

let command = SlashCommand.define (
   ~command = SlashCommand.make ()
      -> SlashCommand.setName ("pong")
      -> SlashCommand.setDescription ("Bot!! Are you alive??"),
      
   ~interaction = int =>
      int->Interaction.respond (Text("Ping?", Public))->done
)