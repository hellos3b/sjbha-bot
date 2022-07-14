import * as Discord from "discord.js";

export const embed = (config: Discord.MessageEmbedOptions): Discord.MessageEmbedOptions => config;

export const isGuildChannel = (channel: Discord.TextBasedChannel): channel is Discord.TextChannel => channel.type === "GUILD_TEXT";