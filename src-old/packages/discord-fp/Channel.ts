import * as TE from "fp-ts/TaskEither";
import * as Discord from "discord.js";
import { NotFoundError } from "@packages/common-errors";
import { pipe } from "fp-ts/lib/pipeable";

export type Channel = Discord.TextChannel | Discord.DMChannel;

export function find(id: string) {
  return (client: Discord.Client) => TE.tryCatch(
    () => client.channels.fetch(id) as Promise<Channel>,
    NotFoundError.lazy(`Could not find guild with id: ${id}`)
  )
}

/**
 * Sends a message to a channel
 * 
 * todo: fix the typing of this disaster
 */
export const send = (content: string | Discord.MessageOptions) => {
  return (channel: Channel) => TE.tryCatch(
    () => (typeof content === 'string') ? channel.send(content) : channel.send(content),
    error => {
      console.error("Failed to send message to channel", {content, error});
      return new Error(`Failed to send message to channel (unknown reasons)`)
    }
  )
};