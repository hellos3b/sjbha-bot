open StdLib

type channel = Discord__Channel.t
type user = Discord__User.t

type embed
type payload
type components

type t = {
  id: string,
  content: string,
  channel: channel,
  author: user,
}

type privacy =
  | Public
  | Private

type response =
  | Text(string, privacy)
  | Embed(embed, privacy)
  | EmbedWithComponents(embed, array<components>, privacy)
  | Error(string)

// embed
module Embed = {
  type t = embed

  type field = {
    name: string,
    value: string,
    inline: bool
  }

  type footer = {
    text: string
  }

  type fieldBounds =
    | Inline
    | Full

  @module("discord.js") @new external make: unit => t = "EmbedBuilder"
  @send external setAuthor_: (t, {..}) => t = "setAuthor"
  @send external setColor: (t, int) => t = "setColor"
  @send external setTitle: (t, string) => t = "setTitle"
  @send external setDescription: (t, string) => t = "setDescription"
  @send external addFields: (t, array<field>) => t = "addFields"
  @send external setFooter_: (t, {..}) => t = "setFooter"

  let setFooter = (t, text: string) =>
    t->setFooter_({"text": text})
  
  let addField = (t, name, value, bounds) =>
    t->addFields([{name: name, value: value, inline: bounds === Inline}])

  let setAuthor = (t: t, name: string, icon: string) =>
    t->setAuthor_({"name": name, "iconURL": icon})
}

@obj external make: (
   ~content: string=?, 
   ~embeds: array<Embed.t>=?, 
   ~ephemeral: bool=?,
   ~components: array<components>=?,
   unit
) => payload = ""

let fromResponse = response => make(
  ~content = {
      let content = switch response {
        | Text(value, _) | Error(value) => Some (value)
        | _ => None
      }
      O.getUnsafe (content)
    },
  ~embeds = switch response {
      | Embed(embed, _) | EmbedWithComponents(embed, _, _) => [embed]
      | _ => []
    },
  ~ephemeral = switch response {
      | Text(_, privacy) 
      | Embed(_, privacy) 
      | EmbedWithComponents(_, _, privacy) => privacy === Private
      | Error(_) => true
    },
  ~components = switch response {
      | EmbedWithComponents(_, components, _) => components
      | _ => []
    },
  ())
  
@send external channelSend_: (channel, payload) => t = "send"
let send = (payload, channel) => channel->channelSend_(payload)

@send external reply: (t, payload) => t = "reply"
@get external channel: t => channel = "channel"