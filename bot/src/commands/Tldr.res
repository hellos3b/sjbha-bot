open Discord
open Belt

type tldr = {
  message: string,
  from: string,
  timestamp: Js.Date.t,
  channelID: string,
  channel: string,
}

let tldrCount = 10
let embedColor = 11393254

module Tldrs = {
  open Database
  open Database.Collection

  external unsafeCastTldr: 'a => tldr = "%identity"

  let fetch = () =>
    withDatabase(db =>
      db
      ->Db.collection("tldrs")
      ->findAll
      ->sort({"timestamp": -1})
      ->limit(tldrCount)
      ->toArray
      ->Promise.thenResolve(arr => arr->Array.map(unsafeCastTldr))
    )

  let insert = (tldr: tldr) => withDatabase(db => db->Db.collection("tldrs")->insertOne(tldr))
}

let tldrField = tldr => {
  let timestamp = tldr.timestamp->DateFns.formatDistance(Js.Date.make())
  let name = tldr.message
  let value = `*${timestamp} • ${tldr.from} • <#${tldr.channelID}>*`
  field(~name, ~value, ())
}

let logEmbed = (tldrs: array<tldr>) => {
  let fields = tldrs->Js.Array2.map(tldrField)
  makeEmbed(~title=`💬 TLDR`, ~color=embedColor, ~fields, ())
}

// Commands
// renders a list of tldrs in a large embed
let sendAll = (message: Discord.message) =>
  Tldrs.fetch()
  ->Promise.thenResolve(tldrs => {
    let embed = makeMessage(~embeds=[logEmbed(tldrs)], ())
    message.channel->send(embed)
  })
  ->ignore

// Save a new tldr to the list
let save = (note: string, message: Discord.message) => {
  let tldr = {
    message: note,
    from: message.author.username,
    timestamp: Js.Date.make(),
    channelID: message.channel.id,
    channel: message.channel.name,
  }

  Tldrs.insert(tldr)
  ->Promise.thenResolve(_ => {
    let embed = makeEmbed(~description=`📌 TLDR Saved`, ~color=embedColor, ())
    let response = makeMessage(~embeds=[embed], ())
    message->reply(response)
  })
  ->ignore
}
