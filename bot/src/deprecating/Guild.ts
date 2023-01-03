import * as DiscordJs from "discord.js";
import { env } from "../environment";

export const member = async (
   memberId: string, 
   client: DiscordJs.Client
) : Promise<DiscordJs.GuildMember | undefined> => {
   const guild = await client.guilds.fetch (env.SERVER_ID);
   return guild.members.fetch (memberId);
};