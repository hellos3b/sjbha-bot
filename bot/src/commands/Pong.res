open Discord

let replyPing = message => {
  let ping = makeMessage(~content="Ping?", ())
  message->reply(ping)->ignore
}
