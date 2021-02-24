import {User, GuildMember} from "discord.js";
import {TaskEither, tryCatch} from "fp-ts/TaskEither";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as G from "./Guild";
import { NotFoundError } from "@packages/common-errors";

export {User, GuildMember};

export function find(id: string) {
  return (guild: G.Guild) => TE.tryCatch(
    () => guild.members.fetch(id),
    NotFoundError.lazy(`Could not find member with id '${id}' in guild '${guild.name}'`)
  )
};

export const hasRole = (member: GuildMember) => {
  return (roleId: string) => member.roles.cache.has(roleId);
}

// todo: find what errors these throw and uh make it more specific
export const addRoleTo = (member: GuildMember) => {
  return (roleId: string): TaskEither<Error, GuildMember> => 
    tryCatch(() => member.roles.add(roleId), E.toError);
}

export const removeRoleFrom = (member: GuildMember) => {
  return (roleId: string): TaskEither<Error, GuildMember> => 
    tryCatch(() => member.roles.remove(roleId), E.toError);
}


// export type User = {
//   readonly id: string;
//   readonly name: string;
//   readonly avatar: string;
//   send: (msg: string | Discord.MessageOptions) => void;
// }

// export type Member = User & {
//   roles: () => void;
// }

// export const fromMember = (m: Discord.GuildMember): Member => ({
//   ...fromUser(m.user),
//   name: m.nickname || m.user.username,
//   roles: () => {

//   }
// })

// export const fromUser = (user: Discord.User): User => ({
//   id: user.id,
//   name: user.username,
//   avatar: user.avatarURL() || DEFAULT_AVATAR,
//   send: msg => {
//     if (typeof msg === 'string') {
//       user.send(msg);
//     } else {
//       user.send(msg);
//     }
//   }
// })

// export const Roles = (memember: Discord.GuildMember) => ({
//   has: (id: string) => {
    
//   }
// })

// export const fetchById = (guild: Discord.Guild) => (id: string) => TE.tryCatch(
//   async () => {
//     const m = guild.member(id) || (await guild.members.fetch(id));
//     return fromMember(m);
//   },
//   NotFoundError.lazy("Could not find member by id " + id)
// );