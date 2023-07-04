module Options = {
  type t
  @send external getString: (t, string) => nullable<string> = "getString"
  @send external getSubcommand: t => string = "getSubcommand"
}

module ChatInputCommand = {
  type t = {
    commandId: string,
    commandName: string,
    options: Options.t,
  }

  external cast: 'a => t = "%identity"
  @send external reply: (t, Message.config) => promise<unit> = "reply"
  @send external deferReply: t => promise<unit> = "deferReply"
  @send external deferUpdate: t => promise<unit> = "deferUpdate"
  @send external fetchReply: t => promise<Message.t> = "fetchReply"
  @send external showModal: (t, Modal.config) => promise<unit> = "showModal"
}

module Button = {
  type t = {
    customId: string,
    message: Message.t,
  }
  external cast: 'a => t = "%identity"
  @send external reply: (t, Message.config) => promise<unit> = "reply"
  @send external deferReply: t => promise<unit> = "deferReply"
  @send external deferUpdate: t => promise<unit> = "deferUpdate"
  @send external showModal: (t, Modal.config) => promise<unit> = "showModal"
}

module ModalSubmit = {
  type fields

  type t = {
    customId: string,
    fields: fields,
    message: nullable<Message.t>,
  }

  external cast: 'a => t = "%identity"
  @send external reply: (t, Message.config) => promise<unit> = "reply"
  @send external editReply: (t, Message.config) => promise<unit> = "editReply"
  @send external update: (t, Message.config) => promise<unit> = "update"
  @send external fetchReply: t => promise<Message.t> = "fetchReply"
  @send external deferUpdate: t => promise<unit> = "deferUpdate"
  @send external isFromMessage: t => bool = "isFromMessage"
  @send external getTextInputValue: (fields, string) => string = "getTextInputValue"
}

type t = {
  id: string,
  channelId: string,
  nickname: string,
}

type details =
  | ChatInput(ChatInputCommand.t)
  | Button(Button.t)
  | ModalSubmit(ModalSubmit.t)
  | Unhandled // discord.js has a bunch of interaction types and we don't care for most of them

@send external isCommand: t => bool = "isCommand"
@send external isButton: t => bool = "isButton"
@send external isModalSubmit: t => bool = "isModalSubmit"

let details = i =>
  if isCommand(i) {
    ChatInput(ChatInputCommand.cast(i))
  } else if isButton(i) {
    Button(Button.cast(i))
  } else if isModalSubmit(i) {
    ModalSubmit(ModalSubmit.cast(i))
  } else {
    Unhandled
  }
