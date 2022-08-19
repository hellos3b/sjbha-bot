open StdLib

type user = {
  id: string, 
  username: string
}

type channel = {
  id: string, 
  name: string,
  @as("type") type_: string
}

type interactionOptions
type interaction = {
  id: string,
  user: user,
  channel: channel,
  channelId: string,
  options: interactionOptions
}

type message = {
  id: string,
  content: string,
  channel: channel,
  author: user,
}

type sendableMessage
type embed

module User = {
  type t = user
}

// message
module ComponentCollector = {
  type t
  type options

  @obj external options: (
    ~time: int=?,
    ~filter: interaction=>bool = ?,
    ()
  ) => options = ""

  @send external stop: t => unit = "stop"
  @send external on: (t, string, 'a => 'b) => unit = "on"
  let onCollect = (t, fn: interaction => 'b) => t->on("collect", fn)
  let onEnd = (t, fn: t => 'b) => t->on("end", fn)
}

module Message = {
  type t = message
  type components

  @obj external make: (
    ~content: string=?, 
    ~embeds: array<embed>=?, 
    ~ephemeral: bool=?,
    ~components: array<components>=?,
    unit
  ) => sendableMessage = ""

  @send external reply: (t, sendableMessage) => t = "reply"
  @get external channel: t => channel = "channel"
  @send external awaitMessageComponent: (t, ComponentCollector.options) => Promise.t<interaction> = "awaitMessageComponent"
  @send external createCollector: (t, ComponentCollector.options) => ComponentCollector.t = "createMessageComponentCollector"
}

// channel
module Channel = {
  type t = channel

  @send external send: (t, sendableMessage) => Message.t = "send"
  
  // custom utils
  type kind = 
    | Text
    | Dm
    | Thread(bool)
    | Unknown

  let kind = (t: t): kind =>
    switch t.type_ {
      | "DM" => Dm
      | "GUILD_TEXT" => Text
      | "GUILD_PUBLIC_THREAD" => Thread(true)
      | "GUILD_PRIVATE_THREAD" => Thread(false)
      | _ => Unknown
    }

  // validations
  let isServerText = (t: t): bool =>
    switch t->kind {
      | Text => true
      | Thread(_) => true
      | _ => false
    }
}

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

  @module("discord.js") @new external make: unit => t = "MessageEmbed"
  @send external setAuthor_: (t, {..}) => t = "setAuthor"
  @send external setColor: (t, int) => t = "setColor"
  @send external setTitle: (t, string) => t = "setTitle"
  @send external setDescription: (t, string) => t = "setDescription"
  @send external addField_: (t, string, string, bool) => t = "addField"
  @send external addFields: (t, array<field>) => t = "addFields"
  @send external setFooter_: (t, {..}) => t = "setFooter"

  let setFooter = (t, text: string) =>
    t->setFooter_({"text": text})

  let addField = (t: t, name: string, value: string, fieldBounds: fieldBounds) =>
    t->addField_(name, value, fieldBounds === Inline)

  let setAuthor = (t: t, name: string, icon: string) =>
    t->setAuthor_({"name": name, "iconURL": icon})
}

module Response = {
  type privacy =
    | Public
    | Private

  type t =
    | Text(string, privacy)
    | Embed(Embed.t, privacy)
    | EmbedWithComponents(Embed.t, array<Message.components>, privacy)
    | Error(string)

  let toMessage = response => Message.make(
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
}

// interaction is what comes when a command is recieved
module Interaction = {
  type t = interaction

  // bindings
  @send external deleteReply: t => Promise.t<unit> = "deleteReply"
  @send external editReply: (t, sendableMessage) => Promise.t<unit> = "editReply"
  @send external fetchReply: t => Promise.t<Message.t> = "fetchReply"
  @send external followUp: (t, sendableMessage) => Promise.t<unit> = "followUp"
  @send external reply: (t, sendableMessage) => Promise.t<unit> = "reply"
  @send external getSubcommand: interactionOptions => option<string> = "getSubcommand"
  @send external getString: (interactionOptions, string) => option<string> = "getString"
  
  // custom API
  let getStringOption = (t: t, option: string): option<string> =>
    t.options->getString(option)

  let getRequiredStringOption = (t: t, option: string) =>
    t->getStringOption(option)
      -> R.fromOption(#MISSING_OPTION(option))

  let respond = (t: t, response: Response.t) => {
    let message = response->Response.toMessage
    t->reply(message)
  }

  let editResponse = (t: t, response: Response.t) => {
    let message = response->Response.toMessage
    t->editReply(message)
  }

  let error = (t: t, exn: exn) => {
     Js.Console.error2 ("An error occured when trying to response to a command. Exception:", exn)
     t->respond(Text("Something unexpected happened", Private))
  }
}

module StringOption = {
  type t

  @send external setName: (t, string) => t = "setName"
  @send external setDescription: (t, string) => t = "setDescription"
  @send external setRequired: (t, bool) => t = "setRequired"
}

// creating slash commands, along with some utils
module SubCommandBuilder = {
  type t

  @send external addStringOption: (t, StringOption.t => StringOption.t) => t = "addStringOption"
  @send external setName: (t, string) => t = "setName"
  @send external setDescription: (t, string) => t = "setDescription"
}

module SlashCommandBuilder = {
  type t

  // bindings
  @module("@discordjs/builders") @new external make: unit => t = "SlashCommandBuilder"
  @send external addSubCommand: (t, SubCommandBuilder.t => SubCommandBuilder.t) => t = "addSubcommand"
  @send external addStringOption: (t, StringOption.t => StringOption.t) => t = "addStringOption"
  @send external setName: (t, string) => t = "setName"
  @send external setDescription: (t, string) => t = "setDescription"
}

module MessageButton = {
  type t

  type style = [
    | #PRIMARY
    | #SECONDARY
    | #SUCCESS
    | #DANGER
    | #LINK
  ]

  @module("discord.js") @new external make: unit => t = "MessageButton"
  @send external setCustomId: (t, string) => t = "setCustomId"
  @send external setLabel: (t, string) => t = "setLabel"
  @send external setStyle: (t, style) => t = "setStyle"
  @send external setDisabled: (t, bool) => t = "setDisabled"
}

module MessageActionRow = {
  type t

  @module("discord.js") @new external make: unit => t = "MessageActionRow"
  @send external addComponents: (t, MessageButton.t) => t = "addComponents"
  @send external addComponents2: (t, MessageButton.t, MessageButton.t) => t = "addComponents"
  @send external addComponents3: (t, MessageButton.t, MessageButton.t, MessageButton.t) => t = "addComponents"
  external toComponents: t => Message.components = "%identity"
}