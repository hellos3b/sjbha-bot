open StdLib
open Discord

type note = {
   moderator: string,
   userId: string,
   note: string,
   timestamp: Date.t
}

module Notes = {
   open MongoDb.Collection
   external unsafeCastNoteArray: {..} => array<note> = "%identity"

   let collection = lazy (MongoDb.getCollection ("mod-notes"))

   let insert = note => 
      Lazy.force (collection)
         -> Promise.flatMap (insertOne(_, note))
         -> Promise.map (_ => note)

   let findById = userId =>
      Lazy.force (collection)
         -> Promise.flatMap (collection => collection
            -> find ({"userId": userId})
            -> sort ({"timestamp": -1})
            -> toArray)
         -> Promise.map (any => any->unsafeCastNoteArray)
}

// make it public in the admin channel so we can share
let modPrivacy = (interaction: Interaction.t) =>
   if interaction.channel.id === Sjbha.Channels.admin { Message.Public }
   else { Message.Private }

//
// Logs a note about a user that can be later looked up
// to see a history
//
let saveNote = (interaction: Interaction.t) => {
   let author = interaction.user

   let user = interaction.options
      -> Interaction.getUser("user")
      -> O.getExn

   let content = interaction.options
      -> Interaction.getString ("note")
      -> O.getExn

   let note = {
      moderator: author.id,
      userId: user.id,
      note: content,
      timestamp: Date.make()
   }

   let note = Notes.insert (note)
   
   note->Promise.map(_ => {
      open Message.Embed
      let embed = Message.Embed.make()
         -> setColor (0xedd711)
         -> setDescription (`🔑 Note logged for ${user.username}`)
   
      Message.Embed(embed, modPrivacy(interaction))
   })
}

//
// See a history of notes that have been left for a user
// to see if they've caused issues in the past
//
let lookupNotes = (interaction: Interaction.t) => {
   let user = interaction.options
      -> Interaction.getUser("user")
      -> O.getExn

   let notes = Notes.findById (user.id)

   let entry = note => {
      let date = note.timestamp->Date.fromNow
      let content = note.note
      j`➡️ **${date}**: $content`
   }

   notes->Promise.map (notes => {
      let description = switch notes->A.length {
         | 0 => `No notes found for this user.`
         | _ => notes
            -> A.map (entry)
            -> A.join ("\n")
      }

      open Message.Embed
      let embed = Message.Embed.make()
         -> setColor (0xedd711)
         -> setTitle (`🔑 Notes for @${user.username}`)
         -> setDescription (description)

      Message.Embed (embed, modPrivacy(interaction))
   })
}

let echo = (interaction: Interaction.t) => {
   let message = interaction.options
      -> Interaction.getString("message")
      -> O.getExn

   Message.make(~content=message, ())
      -> Message.send (interaction.channel)
      -> Promise.map (_ => {
         let confirmation = Message.Embed.make()
            -> Message.Embed.setDescription (`📣 Sent`)
      
         Message.Embed (confirmation, modPrivacy(interaction))
      })
      -> Promise.catch (_ => Message.Error ("Could not send message (Do I have permissions here?)"))
}

//
// The mod commands are tools that help out... well, mods duh
// 
let command = SlashCommand.define (
   ~command = {
      open SlashCommand
      SlashCommand.make()
         -> setName ("mod")
         -> setDescription ("Make a note on a specific user")
         -> setDefaultMemberPermissions (permissions.kick)
         
         -> addSubCommand (option => option
            -> SubCommand.setName ("note")
            -> SubCommand.setDescription ("Log an incident for a particular user")

            -> SubCommand.addUserOption (option => option
               -> UserOption.setName ("user")
               -> UserOption.setDescription ("The user this note is about")
               -> UserOption.setRequired(true))

            -> SubCommand.addStringOption (option => option
               -> StringOption.setName ("note")
               -> StringOption.setDescription ("List ")
               -> StringOption.setRequired(true)))

         -> addSubCommand (option => option
            -> SubCommand.setName ("lookup")
            -> SubCommand.setDescription ("Check mod notes for a particular user")

            -> SubCommand.addUserOption (option => option
               -> UserOption.setName ("user")
               -> UserOption.setDescription ("Select a user")
               -> UserOption.setRequired (true)))

         -> addSubCommand (option => option
            -> SubCommand.setName ("echo")
            -> SubCommand.setDescription ("Make the bot talk (Don't overdo it!)")

            -> SubCommand.addStringOption (option => option
               -> StringOption.setName ("message")
               -> StringOption.setDescription ("The message you want the bot to say")
               -> StringOption.setRequired(true)))
   },

   ~interaction = interaction => {
      let subcommand = interaction.options
         -> Interaction.getSubcommand 
         -> O.getWithDefault ("")
      
      let response = switch subcommand {
         | "note" => interaction->saveNote
         | "lookup" => interaction->lookupNotes
         | "echo" => interaction->echo
         | _ => Message.Error("Unrecognized Command")->Promise.resolve
      }
      
      response->Promise.run (
         ~ok = Interaction.respond (interaction),
         ~catch = Interaction.error (interaction))
   }
)