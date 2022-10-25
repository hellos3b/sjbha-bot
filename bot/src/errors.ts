import { InteractionReplyOptions } from "discord.js";
import { logger } from "./logger";

const log = logger ("errors");

// todo: 
export const makeUnexpectedReply = (): InteractionReplyOptions => ({
   content: "💀 Something unexpected broke the bot"  
});

// todo: print output to bot admin?
export const interactionFailed = (err: Error): void => {
   log.error ("Interaction failed to send", err);
};