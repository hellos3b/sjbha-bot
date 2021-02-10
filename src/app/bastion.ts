import {Bastion} from "@packages/bastion";
import logger from "@packages/logger";
import {SERVER_ID, DISCORD_TOKEN} from "./env";

const log = logger("bastion");

const bastion = new Bastion({
  serverId: SERVER_ID,
  token: DISCORD_TOKEN,
  instigator: "!"
});

bastion.start(client => log.info(`Connected to discord %o`, client.user!.tag));

export default bastion;