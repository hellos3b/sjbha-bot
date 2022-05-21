open Belt
open Discord

let run = (message: Discord.message) => {
  let request = message->content->Js.String2.split(" ")->List.fromArray

  let command = switch request {
  | list{"!pong"} => Pong.pong
  | _ => ignore
  }

  message->command
}
