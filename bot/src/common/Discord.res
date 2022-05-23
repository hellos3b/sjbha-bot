open Belt

type message
type embed
type channel

// message
@send external reply: (message, string) => message = "reply"
@get external channel: message => channel = "channel"
@get external content: message => string = "content"

// channel
@send external sendOptions: (channel, {..}) => message = "send"

let send = (channel, text) => channel->sendOptions({"content": text})
let sendEmbed = (channel, embed) => channel->sendOptions({"embeds": [embed]})

// embed
external castEmbed: {..} => embed = "%identity"

let embed = (
  ~color: option<int>=?,
  ~title: option<string>=?,
  ~description: option<string>=?,
  ~footer: option<string>=?,
  (),
) =>
  {
    "color": color->Js.Nullable.fromOption,
    "title": title->Js.Nullable.fromOption,
    "description": description->Js.Nullable.fromOption,
    "footer": footer->Option.map(f => {"text": f})->Js.Nullable.fromOption,
  }->castEmbed
