import {Bastion} from "@packages/bastion";
import Debug from "debug";
import {SERVER_ID, DISCORD_TOKEN} from "./env";

const debug = Debug("@shared:bastion");

const bastion = new Bastion({
  serverId: SERVER_ID,
  token: DISCORD_TOKEN,
  instigator: "!"
});

bastion.start(client => debug(`Connected to discord %o`, client.user!.tag));

export default bastion;