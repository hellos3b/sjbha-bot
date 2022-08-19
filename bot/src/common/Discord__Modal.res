type t


module Text = {
   type t

   type style = 
      | Short
      | Paragraph

   @module("discord.js") @new external make: unit => t = "TextInputBuilder"
   @send external setCustomId: (t, string) => t = "setCustomId"
   @send external setLabel: (t, string) => t = "setLabel"

   @send external setStyle_: (t, int) => t = "setStyle"
   let setStyle = (t, style) => {
      let code = switch style {
         | Short => 1
         | Paragraph => 2
      }

      t->setStyle_(code)
   }
}

module SelectMenu = {
   type t
}

module ActionRow = {
   type t

   @module("discord.js") @new external make: unit => t = "ActionRowBuilder"
   @send external addText: (t, Text.t) => t = "addComponents"
}

@module("discord.js") @new external make: unit => t = "ModalBuilder"
@send external setCustomId: (t, string) => t = "setCustomId"
@send external setTitle: (t, string) => t = "setTitle"
@send external addAction: (t, ActionRow.t) => t = "addComponents"
@send external addAction2: (t, ActionRow.t, ActionRow.t) => t = "addComponents"