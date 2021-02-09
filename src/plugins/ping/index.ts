import bastion from "@app/bastion";

bastion
  .command("!pong")
  .subscribe(req => req.channel.send("...ping? (COMMAND)"));