import * as Discord from "discord.js";
import {pipe} from "fp-ts/pipeable";
import * as O from "fp-ts/Option";

const DEFAULT_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

export interface DiscordUser {
  readonly id: string;
  readonly name: string;
  readonly avatar: string;
}

export const DiscordUser = (user: Discord.User, member?: Discord.GuildMember | null): DiscordUser => ({
  id: user.id,

  name: pipe(
    O.fromNullable(member),
    O.chain(m => O.fromNullable(m.nickname)),
    O.getOrElse(() => user.username)
  ),

  avatar: user.avatarURL() || DEFAULT_AVATAR
});