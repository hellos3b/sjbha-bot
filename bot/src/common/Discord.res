type user = {id: string, username: string}

type channel = {id: string, name: string}

type message = {
  content: string,
  channel: channel,
  author: user,
}

type sendableMessage

type embed
type field
type footer

// message
@obj
external makeMessage: (~content: string=?, ~embeds: array<embed>=?, unit) => sendableMessage = ""
@send external reply: (message, sendableMessage) => message = "reply"

// channel
@send external send: (channel, sendableMessage) => message = "send"

// embed
@obj
external makeEmbed: (
  ~color: int=?,
  ~title: string=?,
  ~description: string=?,
  ~fields: array<field>=?,
  ~footer: footer=?,
  unit,
) => embed = ""

@obj external footer: (~text: string=?, unit) => footer = ""
@obj external field: (~name: string, ~value: string, ~inline: bool=?, unit) => field = ""
