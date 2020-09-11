import Bastion from "./lib/Bastion";
import Debug from "debug";
import {SERVER_ID, DISCORD_TOKEN} from "@app/env";

const debug = Debug("@services:bastion");

const bastion = new Bastion({
  serverId: SERVER_ID,
  token: DISCORD_TOKEN,
  instigator: "!"
});

bastion.start(client => debug(`Connected to discord %o`, client.user!.tag));

export default bastion;

// Expose types
export type {default as Request} from "./lib/Request"
export type {default as Router} from "./lib/Router";
export type {Middleware} from "./lib/Router";
export type {DiscordMember} from "./lib/Bastion";