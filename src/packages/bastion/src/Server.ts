import * as Discord from "discord.js";
import {Maybe} from "purify-ts";
import {DiscordUser} from "./DiscordUser";

export interface Server {
  readonly id: string;
  channel(id: string): Discord.TextChannel;
  member(id: string): DiscordUser;
}

export const Server = (guild: Discord.Guild): Server => ({
  id: guild.id,

  channel: id => {
    const channel = guild.channels.cache.get(id) as Discord.TextChannel;
    if (!channel) throw new Error(`Can't get channel with id ${id}`);
    return channel;      
  },

  member(id: string) {
    const member = guild.member(id);
    const user = guild.client.users.cache.get(id);

    if (!member || !user) throw new Error(`Could not get user with id ${id}`);

    return DiscordUser(user, member);
  }
})