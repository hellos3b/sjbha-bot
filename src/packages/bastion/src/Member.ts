import * as Discord from "discord.js";
import {pipe} from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { NotFoundError } from "@packages/common-errors";

const DEFAULT_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

export interface Member {
  readonly id: string;
  readonly name: string;
  readonly avatar: string;
}

export const fromMember = (m: Discord.GuildMember): Member => ({
  id: m.id,
  name: m.nickname || m.user.username,
  avatar: m.user.avatarURL() || DEFAULT_AVATAR  
})

export const fromUser = (user: Discord.User): Member => ({
  id: user.id,
  name: user.username,
  avatar: user.avatarURL() || DEFAULT_AVATAR    
})

export const fetchById = (guild: Discord.Guild) => (id: string) => TE.tryCatch(
  async () => {
    const m = guild.member(id) || (await guild.members.fetch(id));
    return fromMember(m);
  },
  NotFoundError.lazy("Could not find member by id " + id)
);