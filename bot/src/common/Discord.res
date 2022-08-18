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

module User = {
  type t = user
}

// message
module Message = {
  type t = message
  @obj external make: (
    ~content: string=?, 
    ~embeds: array<embed>=?, 
    ~ephemeral: bool=?,
    unit
  ) => sendableMessage = ""

  @send external reply: (t, sendableMessage) => t = "reply"
  @get external channel: t => channel = "channel"
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

  type fieldBox =
    | Inline
    | Full

  @obj external make: (
    ~color: int=?,
    ~title: string=?,
    ~description: string=?,
    ~fields: array<field>=?,
    ~footer: footer=?,
    unit,
  ) => t = ""

  let footer = (text: string): footer => { 
    text: text 
  }

  let field = (name: string, value: string, box: fieldBox) => {
    name: name, 
    value: value, 
    inline: box === Inline
  }
}

module Response = {
  type privacy =
    | Public
    | Private

  type t =
    | Text(string, privacy)
    | Embed(Embed.t, privacy)
    | Error(string)
}

// interaction is what comes when a command is recieved
module Interaction = {
  type options
  type t = {
    user: User.t,
    channel: Channel.t,
    options: options
  }

  // bindings
  @send external reply: (t, sendableMessage) => PR.t<Message.t, exn> = "reply"
  @send external getSubcommand: options => option<string> = "getSubcommand"
  @send external getString: (options, string) => option<string> = "getString"
  
  // custom API
  let getStringOption = (t: t, option: string): option<string> =>
    t.options->getString(option)

  let respond = (t: t, response: Response.t): unit => {
    let message = Message.make(
      ~content = {
          let content = switch response {
            | Text(value, _) | Error(value) => Some (value)
            | _ => None
          }
          O.getUnsafe (content)
        },
      ~embeds = switch response {
          | Embed(embed, _) => [embed]
          | _ => []
        },
      ~ephemeral = switch response {
          | Text(_, privacy) | Embed(_, privacy) => privacy === Public
          | Error(_) => true
        },
      ())

    t->reply(message)->ignore
  }

  let error = (t: t, exn: exn): unit => {
     Js.Console.error2 ("Error happened when attempting to resolve", exn)
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