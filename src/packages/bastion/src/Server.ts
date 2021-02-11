import * as Discord from "discord.js";
import * as TE from "fp-ts/TaskEither";
import {NotFound} from "@packages/common-errors";
import * as Member from "./Member";

export interface Server {
  readonly id: string;
  getMember: (id: string) => TE.TaskEither<Error, Member.Member>;
}

export const server = (guild: Discord.Guild): Server => ({
  id: guild.id,
  getMember: Member.fetchById(guild)
})

export const fetchById = (client: Discord.Client) => (id: string): TE.TaskEither<Error, Server> => TE.tryCatch(
  async () => {
    const cache = client.guilds.cache.get(id);
    const guild = (!cache) ? (await client.guilds.fetch(id)) : cache;
    if (!guild) throw new Error("Can't find guild");

    return server(guild);
  },
  NotFound.fromError
);

//   return {
//     id: guild.id,

//     channel: id => {
//       const channel = guild.channels.cache.get(id) as Discord.TextChannel;
//       if (!channel) throw new Error(`Can't get channel with id ${id}`);
//       return channel;      
//     },

//     member(id: string) {
//       const member = guild.member(id);
//       const user = guild.client.users.cache.get(id);

//       if (!member || !user) throw new Error(`Could not get user with id ${id}`);

//       return Member(user, member);
//     }
//   }
// };