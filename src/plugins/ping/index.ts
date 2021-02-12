import {command} from "@app/bastion";

command("pong")
  .subscribe(req => req.channel.send("...ping? (COMMAND)"));