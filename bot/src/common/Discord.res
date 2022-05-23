type channel
type message = {
  content: string,
  channel: channel,
}
type sendableMessage

type embed
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
  ~footer: footer=?,
  unit,
) => embed = ""

@obj external footer: (~text: string=?, unit) => footer = ""
