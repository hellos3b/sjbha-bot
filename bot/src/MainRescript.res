open Belt
open Discord

let toString = (a: list<string>) => a->List.toArray->Js.Array2.joinWith(" ")

let run = (message: Discord.message) => {
  let request = message.content->Js.String2.split(" ")->List.fromArray

  let command = switch request {
  | list{"!aqi"} => Aqi.post
  | list{"!christmas"} => Christmas.daysLeft
  | list{"!pong"} => Pong.replyPing
  | list{"!tldr"} => Tldr.sendAll
  | list{"!tldr", ...tldr} => Tldr.save(tldr->toString)
  | list{"!version"} => Version.sendVersion
  | _ => ignore
  }

  command(message)
}
