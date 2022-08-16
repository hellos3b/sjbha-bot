open StdLib
open Discord

let toString = (a: list<string>) => 
  a->L.toArray->A.join (" ")

let run = (message: Discord.message) => {
  let request = message.content
    -> String.split (" ")
    -> A.toList

  let command = switch request {
    | list{"!aqi"} => Aqi.post
    | list{"!christmas"} => Christmas.daysLeft
    | _ => ignore
  }

  command(message)
}
