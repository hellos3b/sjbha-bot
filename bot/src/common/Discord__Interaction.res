open StdLib

type user = Discord__User.t
type payload = Discord__Message.payload
type message = Discord__Message.t
type messageComponents = Discord__Message.components
type embed = Discord__Message.Embed.t
type channel = Discord__Channel.t
type modal = Discord__Modal.t
type response = Discord__Message.response

type options

type t = {
  id: string,
  user: user,
  channel: channel,
  channelId: string,
  options: options
}

// bindings
@send external deleteReply: t => Promise.t<unit> = "deleteReply"
@send external editReply: (t, payload) => Promise.t<unit> = "editReply"
@send external fetchReply: t => Promise.t<message> = "fetchReply"
@send external followUp: (t, payload) => Promise.t<unit> = "followUp"
@send external reply: (t, payload) => Promise.t<unit> = "reply"
@send external getSubcommand: options => option<string> = "getSubcommand"
@send external getString: (options, string) => option<string> = "getString"
@send external showModal: (t, modal) => Promise.t<unit> = "showModal"

// custom API
let getStringOption = (t: t, option: string): option<string> =>
   t.options->getString(option)

let getRequiredStringOption = (t: t, option: string) =>
   t->getStringOption(option)
   -> R.fromOption(#MISSING_OPTION(option))

let respond = (t: t, response: response) => {
   let message = response->Discord__Message.fromResponse
   t->reply(message)
}

let editResponse = (t: t, response: response) => {
   let message = response->Discord__Message.fromResponse
   t->editReply(message)
}

let error = (t: t, exn: exn) => {
   Js.Console.error2 ("An error occured when trying to response to a command. Exception:", exn)
   t->respond(Text("Something unexpected happened", Private))
}

