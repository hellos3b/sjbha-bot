import {CustomError} from "@packages/common/errors";
import { MessageOptions } from "discord.js";

export const errorResponse = (err: Error): MessageOptions => {
  if (err instanceof NotConnected) {
    return {content: err.message}
  }

  console.error("Unexpected error occured: ", err);
  return {content: "Something unexpected happened"};
}

export class NotConnected extends CustomError {}