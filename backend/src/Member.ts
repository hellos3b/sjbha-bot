import * as DiscordJs from 'discord.js';
import { env } from './app';

export const fetch = async (memberId: string, client: DiscordJs.Client) : Promise<DiscordJs.GuildMember> => {
  const guild = await client.guilds.fetch (env.SERVER_ID);
  return guild.members.fetch (memberId);
}