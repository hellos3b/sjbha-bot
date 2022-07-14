open Belt
open Discord

let toString = (a: list<string>) => a->List.toArray->Js.Array2.joinWith(" ")

let run = (message: Discord.message) => {
  let request = message.content->Js.String2.split(" ")->List.fromArray

  let command = switch request {
  | list{"!aqi"} => Aqi.post
  | list{"!christmas"} => Christmas.daysLeft
  | _ => ignore
  }

  command(message)
}
