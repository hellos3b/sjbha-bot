import {createBastion} from "@packages/bastion";
import {DISCORD_TOKEN} from "./env";

const bastion = createBastion(DISCORD_TOKEN);

export const command = bastion.commander("!");