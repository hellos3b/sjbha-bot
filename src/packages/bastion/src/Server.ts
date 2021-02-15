import * as Discord from "discord.js";
import * as TE from "fp-ts/TaskEither";
import {pipe} from "fp-ts/function";
import {NotFound} from "@packages/common/errors";
import * as Member from "./Member";

export interface Server {
  readonly id: string;
  getMember: (id: string) => TE.TaskEither<Error, Member.Member>;
}

export const server = (guild: Discord.Guild): Server => ({
  id: guild.id,
  getMember: Member.fetchById(guild)
});

export const fetchById = (client: Discord.Client) => (id: string): Server => {
  const guild = TE.tryCatch<Error, Discord.Guild>(
    async () => {
      const cache = client.guilds.cache.get(id);
      const guild = (!cache) ? (await client.guilds.fetch(id)) : cache;
      if (!guild) throw NotFound.create("Can't find guild");
      return guild;
    },
    NotFound.fromError
  );

  return {
    id,
    getMember: (id: string) => pipe(
      guild, 
      TE.chain(g => Member.fetchById(g)(id))
    )
  }
};