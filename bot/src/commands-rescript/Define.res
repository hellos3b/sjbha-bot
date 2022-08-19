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
// How long should a definition be removable - prevent memory leak from long running
let remove_timeout = Date.minutesToMilliseconds (10)
// The length
let max_field_length = 1024
let icon = "https://imgur.com/0tEBa59.png"

external unsafeCastResponse: 'a => udResponse = "%identity"
let fetchDefinitions = (word: string) => {
   open SuperAgent
   get ("http://api.urbandictionary.com/v0/define")
      -> query ({"term": word})
      -> run
      -> Promise.map (res => {
         let response = res.body->unsafeCastResponse
         Ok(response.list)
      })
      -> Promise.catch (_ => Error(#API_FAILURE))
}

//
// Show preference to text that is under the max length
//
let findBestMatch = (definitions: array<definition>) =>
   definitions
      -> A.keep (it => 
         it.definition->String.length < max_field_length
         && it.example->String.length < max_field_length)
      -> A.get (0)
      -> O.alt (definitions->A.get(0))
      -> R.fromOption (#NO_VALID_DEFINITIONS)

//
// UD includes some key words like [this] so lets italicize them
//
let italicizeReferences = str => {
   let exp = Js.Re.fromStringWithFlags("\\[|\\]", ~flags="g")
   str->String.replaceByRe (exp, "*")
}

//
// this helps prevent reaching a character limit in discord embeds
//
let capLength = (str, len) => str->String.substrAtMost (~from=0, ~length=len)

let removeButton = MessageButton.make()
   -> MessageButton.setCustomId ("undefine")
   -> MessageButton.setLabel ("Remove")
   -> MessageButton.setStyle (#DANGER)

let expiredButton = MessageButton.make()
   -> MessageButton.setCustomId ("undefine")
   -> MessageButton.setLabel ("Remove (expired)")
   -> MessageButton.setStyle (#DANGER)
   -> MessageButton.setDisabled (true)

type action =
   | Removable
   | Expired

let render = (definition, button) => {
   let definitionText = definition.definition
      -> italicizeReferences
      -> capLength (max_field_length)

   let exampleText = definition.example
      -> italicizeReferences
      -> capLength (max_field_length)

   let button = switch button {
      | Expired => expiredButton
      | Removable => removeButton
   }
   
   let actions = MessageActionRow.make()
      -> MessageActionRow.addComponents (button)
      -> MessageActionRow.toComponents

   open Embed
   let embed = Embed.make()
      -> setColor (16201999)
      -> setAuthor (definition.word, icon)
      -> addField("Definition", definitionText, Full)
      -> addField("Examples", exampleText, Full)
      -> setFooter ("Definition was pulled from urbandictionary.com")

   Response.EmbedWithComponents (embed, [actions], Public)
}

//
// Posts the definition along with examples.
// Provides a "Remove" button in case there is some NSFW content in the embed 
//
let postDefinition = (interaction, definition) => {
   let response = render(definition, Removable)

   let message = interaction
      -> Interaction.respond(response)
      -> Promise.flatMap (_ => Interaction.fetchReply(interaction))
      
   // disables the remove button when it's been up long enough
   let expire = _ => interaction
      -> Interaction.editResponse (render(definition, Expired))
      -> Promise.catchResult (_ => #EDIT_FAIL)

   // removes the post (if it's NSFW)
   let removePost = collector =>
      interaction
         -> Interaction.deleteReply
         -> Promise.map (_ => ComponentCollector.stop(collector))
         -> Promise.ignoreError

   // only the one who posted the definition can remove it
   let warnInvalidOwner = it => it
      -> Interaction.respond (Response.Error ("Definitions can only be removed by the one who posted it"))
      -> Promise.ignoreError

   // validat 
   let isOwner = (it: Interaction.t) =>
      if it.user.id === interaction.user.id { Ok(it) }
      else { Error(#NO_PERMISSION) }

   let handleClickRemove = (it: Interaction.t, collector: ComponentCollector.t) =>
      switch it->isOwner {
         | Ok(_) => removePost(collector)
         | Error(#NO_PERMISSION) => warnInvalidOwner(it)
      }

   // Enable removing the definition, in case it's super NSFW or something
   message->Promise.map (message => {
      let options = ComponentCollector.options(
         ~time=remove_timeout,
         ())

      let collector = message->Message.createCollector(options)
      collector->ComponentCollector.onCollect (handleClickRemove(_, collector))
      collector->ComponentCollector.onEnd (expire)
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
      let word = interaction
         -> Interaction.getRequiredStringOption ("word")

      let definition = word
         -> R.flatMapAsync(fetchDefinitions)
         -> Promise.map (R.flatMap(_, findBestMatch))

      let _ = definition->Promise.flatMap (result => switch result {
         | Ok(definition) => {
            postDefinition(interaction, definition)
         }
      
         | Error(error) => {
            let response = switch error {
               | #NO_VALID_DEFINITIONS => {
                  let w = word->R.getWithDefault ("(error)")
                  Response.Text (`Could not find a definition for '${w}'`, Private)
               }

               | #API_FAILURE => {
                  Response.Error ("Failed to fetch definition from UrbanDictionary")
               }

               | _ => {
                  Response.Error ("Failed to get the definition, for unknown reasons")
               }
            }

            interaction->Interaction.respond(response)
         }
      })
   }
)