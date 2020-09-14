import bastion from "@services/bastion";

bastion.use("pong", req => {
  req.reply("...ping?")
});