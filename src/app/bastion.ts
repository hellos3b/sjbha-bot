import {createBastion} from "@packages/bastion";
import {DISCORD_TOKEN, SERVER_ID} from "./env";

const bastion = createBastion(DISCORD_TOKEN);

export const command = bastion.commander("!");
export const server = bastion.server(SERVER_ID);