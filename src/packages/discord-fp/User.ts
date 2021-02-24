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
    hasRole(member)(roleId) 
      ? TE.right(member)
      : tryCatch(() => member.roles.add(roleId), E.toError);
}

export const removeRoleFrom = (member: GuildMember) => {
  return (roleId: string): TaskEither<Error, GuildMember> => 
    hasRole(member)(roleId)
      ? tryCatch(() => member.roles.remove(roleId), E.toError)
      : TE.right(member);
}