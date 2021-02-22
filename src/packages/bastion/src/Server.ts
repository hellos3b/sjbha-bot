import * as Discord from "discord.js";
import * as TE from "fp-ts/TaskEither";
import {pipe} from "fp-ts/function";
import {NotFoundError} from "@packages/common-errors";
import * as Member from "./Member";
import * as Channel from "./Channel";

export interface Server {
  readonly id: string;
  getMember: (id: string) => TE.TaskEither<NotFoundError, Member.Member>;
  channel: (id: string) => TE.TaskEither<NotFoundError, Channel.Channel>;
}

export const server = (guild: Discord.Guild): Server => ({
  id: guild.id,
  getMember: Member.fetchById(guild),
  channel: Channel.fromGuild(guild)
});

export const fetchById = (client: Discord.Client) => (id: string): Server => {
  const guild = TE.tryCatch(
    async () => {
      const cache = client.guilds.cache.get(id);
      const guild = (!cache) ? (await client.guilds.fetch(id)) : cache;
      if (!guild) throw NotFoundError.create("Can't find guild");
      return guild;
    },
    NotFoundError.lazy("Could not find guild with id " + id)
  );

  return {
    id,
    getMember: (id: string) => pipe(
      guild, 
      TE.chain(g => Member.fetchById(g)(id))
    ),
    channel: (id: string) => pipe(
      guild,
      TE.chain(g => Channel.fromGuild(g)(id))
    )
  }
};