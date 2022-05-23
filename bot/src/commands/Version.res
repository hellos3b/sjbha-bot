open Discord

@val @scope(("process", "env")) external version: string = "npm_package_version"

let sendVersion = message => message->channel->send(j`BoredBot v$version`)->ignore
