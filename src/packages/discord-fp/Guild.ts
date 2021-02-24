import * as TE from "fp-ts/TaskEither";
import * as Discord from "discord.js";
import { NotFoundError } from "@packages/common-errors";

export type Guild = Discord.Guild;

export function find(id: string) {
  return (client: Discord.Client) => TE.tryCatch(
    () => client.guilds.fetch(id),
    NotFoundError.lazy(`Could not find guild with id: ${id}`)
  )
};