type interaction = Discord__Interaction.t
type message = Discord__Message.t
type messageComponents = Discord__Message.components

// message
module Collector = {
   type t
   type options

   @obj external options: (
      ~time: int=?,
      ~filter: interaction=>bool = ?,
      ()
   ) => options = ""
  
   @send external awaitMessage: (message, options) => Promise.t<interaction> = "awaitMessageComponent"
   @send external make: (message, options) => t = "createMessageComponentCollector"

   @send external stop: t => unit = "stop"
   @send external dispose: t => unit = "dispose"
   @send external on: (t, string, 'a => 'b) => unit = "on"
   let onCollect = (t, fn: interaction => 'b) => t->on("collect", fn)
   let onEnd = (t, fn: t => 'b) => t->on("end", fn)
}

module Button = {
   type t

   type style =
      | Primary
      | Secondary
      | Success
      | Danger
      | Link

   @module("discord.js") @new external make: unit => t = "ButtonBuilder"
   @send external setCustomId: (t, string) => t = "setCustomId"
   @send external setLabel: (t, string) => t = "setLabel"
   @send external setDisabled: (t, bool) => t = "setDisabled"

   @send external setStyle_: (t, int) => t = "setStyle"
   let setStyle = (t, style) => {
      let code = switch style {
         | Primary => 1
         | Secondary => 2
         | Success => 3
         | Danger => 4
         | Link => 5
      }

      t->setStyle_(code)
   }
}

module ActionRow = {
   type t

   @module("discord.js") @new external make: unit => t = "ActionRowBuilder"
   @send external addComponents: (t, Button.t) => t = "addComponents"
   @send external addComponents2: (t, Button.t, Button.t) => t = "addComponents"
   @send external addComponents3: (t, Button.t, Button.t, Button.t) => t = "addComponents"
   external toComponents: t => messageComponents = "%identity"
}