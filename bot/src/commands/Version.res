open Discord

@val @scope(("process", "env")) external version: string = "npm_package_version"

let sendVersion = message => {
  let reply = makeMessage(~content=j`BoredBot v$version`, ())
  message.channel->send(reply)->ignore
}
