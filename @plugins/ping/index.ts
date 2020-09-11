import bastion from "@services/bastion";

bastion.use("ping", req => {
  req.reply("Pong!")
});