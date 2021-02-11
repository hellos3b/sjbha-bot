import {command} from "@app/bastion";

command("pong")
  .subscribe(req => req.channel.message("...ping? (COMMAND)"));