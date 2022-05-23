open Belt
open Discord

let run = (message: Discord.message) => {
  let request = message.content->Js.String2.split(" ")->List.fromArray

  let command = switch request {
  | list{"!aqi"} => Aqi.post
  | list{"!christmas"} => Christmas.daysLeft
  | list{"!pong"} => Pong.replyPing
  | list{"!version"} => Version.sendVersion
  | _ => ignore
  }

  command(message)
}
