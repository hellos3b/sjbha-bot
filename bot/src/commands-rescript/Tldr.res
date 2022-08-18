open StdLib
open Discord

type tldr = {
   message: string,
   from: string,
   timestamp: Date.t,
   channelID: string,
   channel: string
}

module Tldrs = {
   external unsafeCastTldrArray: {..} => array<tldr> = "%identity"

   let collection = lazy (MongoDb.getCollection ("tldrs"))

   let fetchRecent = (count: int) => {
      open MongoDb.Collection
      Lazy.force (collection)
         -> P.chain (collection => collection
            -> findAll
            -> sort ({"timestamp": -1})
            -> limit (count)
            -> toArray)
         -> P.map (unsafeCastTldrArray)
         -> PR.fromPromise (_ => #DATABASE_ERROR)
   }

   let insert = (tldr: tldr) => {
      open MongoDb.Collection
      Lazy.force (collection)
         -> P.chain (insertOne(_, tldr))
         -> P.map (_ => tldr)
         -> PR.fromPromise (_ => #DATABASE_ERROR)
   }
}

let tldrs_count = 10
let embed_color = 11393254

let listRecentTldrs = (interaction: Interaction.t): P.t<Response.t> => {
   let tldrs = Tldrs.fetchRecent(tldrs_count)

   tldrs->PR.fold (tldrs => switch tldrs {
      | Ok(tldrs) => {
         let fields = tldrs->A.map (tldr => {
            let value = `*${Date.fromNow (tldr.timestamp)} • ${tldr.from} • <#${tldr.channelID}>*`
            Embed.field (tldr.message, value, Full)
         })

         let embed = Embed.make(
            ~title = `💬 TLDR`,
            ~color = embed_color,
            ~fields,
            ())

         // prevent spam in other channels
         let privacy: Response.privacy = 
            if interaction.channel.id === "" { Public }
            else { Private }

         Response.Embed (embed, privacy)
      }

      | Error(#DATABASE_ERROR) => {
         Response.Error("Problem loading tldrs from database")
      }

      | _ => { 
         Response.Error ("Something unexpected happened")
      }
   })
}

// Saves a new tldr into the db
let saveNewTldr = (interaction: Interaction.t): P.t<Response.t> => {
   let note = interaction
      -> Interaction.getStringOption ("note")
      -> PR.fromOption (#MISSING_ARG("note"))
      
   let tldr = note-> PR.flatMap (note =>
      Tldrs.insert ({
         message: note,
         from: interaction.user.username,
         timestamp: Date.make(),
         channelID: interaction.channel.id,
         channel: interaction.channel.name
      }))
      
   tldr-> PR.fold (tldr => switch tldr {
      | Ok(tldr) => {
            let embed = Embed.make (
               ~color = embed_color, 
               ~description = `📖 ${tldr.message}`, 
            ())

            Response.Embed (embed, Public)
         }

      | Error(#DATABASE_ERROR) => {
         Response.Error("Unable to save TLDR")
      }

      | Error(#MISSING_ARG(name)) => {
         Response.Error(`Missing required option ${name}`)
      }

      | _ => { 
         Response.Error ("Unknown Reasons")
      }
   })
}

let command = SlashCommand.define (
   ~command = SlashCommand.make (
      ~name = "tldr",
      ~description = "Summarize things that happen on discord",
      ~subcommands = [
         SlashCommand.subcommand (
            ~name = "list",
            ~description = "Get a list of the most recent notes",
            ()),

         SlashCommand.subcommand (
            ~name = "save",
            ~description = "Save a new note",
            ~options = [
               SlashCommand.stringOption (
                  ~name = "note",
                  ~description = "What do you want to save?",
                  ~required = true,
                  ())
            ], ())
      ], ()),

   ~interaction = interaction => {
      let subcommand = interaction.options
         -> Interaction.getSubcommand

      let response = switch subcommand {
         | Some("list") => interaction->listRecentTldrs
         | Some("save") => interaction->saveNewTldr
         | _ => Response.Error("Invalid Command")->P.resolve
      }

      response->P.run (
         ~ok = Interaction.respond (interaction),
         ~catch = Interaction.error (interaction))
   }
)
