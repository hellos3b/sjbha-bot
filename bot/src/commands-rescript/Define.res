open StdLib
open Discord

type definition = {
   word: string,
   definition: string,
   thumbs_up: int,
   thumbs_down: int,
   example: string,
}

type udResponse = {
   list: array<definition>
}

let max_definition_length = 1024
let icon = "https://imgur.com/0tEBa59.png"

external unsafeCastResponse: 'a => udResponse = "%identity"
let fetchDefinitions = (word: string) =>
   SuperAgent.get ("http://api.urbandictionary.com/v0/define")
      -> SuperAgent.query ({"term": word})
      -> SuperAgent.run
      -> Promise.map (res => {
         let response = res.body->unsafeCastResponse
         Ok(response.list)
      })
      -> Promise.catch (_ => Error(#API_FAILURE))

// Show preference to text that is under the max length
let findValid = (definitions: array<definition>) =>
   definitions
      -> A.keep (it => 
         it.definition->String.length < max_definition_length
         && it.example->String.length < max_definition_length)
      -> A.get (0)
      -> O.alt (definitions->A.get(0))
      -> R.fromOption (#NO_VALID_DEFINITIONS)

// UD includes some key words like [this] so lets italicize them
let replaceBrackets = str => {
   let exp = Js.Re.fromStringWithFlags("\\[|\\]", ~flags="g")
   str->String.replaceByRe (exp, "*")
}

// this helps prevent reaching a character limit in discord embeds
let capLength = (str, len) =>
   str->String.substrAtMost (~from=0, ~length=len)

let showDefinition = interaction => {
   let word = interaction
      -> Interaction.getRequiredStringOption ("word")

   let definition = word
      -> R.flatMapAsync(fetchDefinitions)
      -> Promise.map (R.flatMap(_, findValid))

   definition->Promise.map (def => switch def {
      | Ok(def) => {
         let definition = def.definition
            -> replaceBrackets
            -> capLength (max_definition_length)

         let example = def.example
            -> replaceBrackets
            -> capLength (max_definition_length)

         open Embed
         let embed = Embed.make()
            -> setColor (16201999)
            -> setAuthor (def.word, icon)
            -> addField("Definition", definition, Full)
            -> addField("Examples", example, Full)
            -> setFooter ("Definition was pulled from urbandictionary.com")

         Response.Embed (embed, Public)
      }

      | Error(#NO_VALID_DEFINITIONS) => {
         let w = word->R.getWithDefault ("(error)")
         Response.Text (`Could not find a definition for '${w}'`, Public)
      }

      | Error(#API_FAILURE) => {
         Response.Error ("Failed to fetch definition from UrbanDictionary")
      }

      | _ => {
         Response.Error ("Failed to get the definition, for unknown reasons")
      }
   })
}
      
//
// Define pulls up definitions from urban dictionary
// for a quick lookup on what a word (slang) means
//
// Most of the time the answers are dum, so it's kinda funny
//
let command = SlashCommand.define(
   ~command = SlashCommand.make (
      ~name = "define",
      ~description = "Look up the definition of a word, according to the all knowing urban dictionary",
      ~options = [
         SlashCommand.stringOption (
            ~name = "word",
            ~description = "The word you want a definition for",
            ~required = true,
            ())
      ],
      ()),

   ~interaction = interaction => {
      showDefinition(interaction)
         -> Promise.run (
            ~ok = Interaction.respond (interaction),
            ~catch = Interaction.error (interaction))
   }
)