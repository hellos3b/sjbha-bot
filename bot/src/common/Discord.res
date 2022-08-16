type user = {id: string, username: string}

type channel = {id: string, name: string}

type message = {
  content: string,
  channel: channel,
  author: user,
}

type sendableMessage

type embed
type field = {
  name: string,
  value: string,
  inline: bool
}

type footer = {
  text: string
}

// message
module Message = {
  type t = message
  @obj external make: (~content: string=?, ~embeds: array<embed>=?, unit) => sendableMessage = ""
  @send external reply: (t, sendableMessage) => t = "reply"
}

// channel
module Channel = {
  type t = channel
  @send external send: (t, sendableMessage) => Message.t = "send"
}

// embed
module Embed = {
  type t = embed
  @obj external make: (
    ~color: int=?,
    ~title: string=?,
    ~description: string=?,
    ~fields: array<field>=?,
    ~footer: footer=?,
    unit,
  ) => t = ""

  let footer = (text: string): footer => { text: text }
  let field = (name: string, value: string, inline: bool) => {name: name, value: value, inline: inline}
}

module Interaction = {
  type t
  @send external reply: (t, string) => Message.t = "reply"
}

module Command = {
  type t
  type config = {
    command: t,
    interaction: Interaction.t => unit
  }

  @module("@discordjs/builders") @new external new_: unit => t = "SlashCommandBuilder"
  @send external setName: (t, string) => t = "setName"
  @send external setDescription: (t, string) => t = "setDescription"

  let make = (~name: string, ~description: string): t =>
    new_()
      -> setName (name)
      -> setDescription (description)

  let config = (~command: t, ~interaction: Interaction.t => unit) => {
    command: command,
    interaction: interaction
  }
}