import * as Discord from "discord.js";
import * as R from "ramda";
import {Maybe} from "purify-ts";

const DEFAULT_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

export interface DiscordUser {
  readonly id: string;
  readonly name: string;
  readonly avatar: string;
}

export const DiscordUser = (user: Discord.User, member?: Discord.GuildMember | null): DiscordUser => ({
  id: user.id,

  name: Maybe
    .fromNullable(member)
    .chainNullable(R.prop("nickname"))
    .orDefault(user.username),

  avatar: Maybe
    .fromNullable(user.avatarURL())
    .orDefault(DEFAULT_AVATAR)
});