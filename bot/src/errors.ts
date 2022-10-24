import { InteractionReplyOptions } from "discord.js";
import { logger } from "./logger";

const log = logger ("errors");

// todo: 
export const makeUnexpectedReply = (): InteractionReplyOptions => ({
   content: "💀 Failed"  
});

// todo: print output to bot admin?
export const interactionFailed = (err: Error): void => {
   log.error ("Interaction failed to send", err);
};