import * as Discord from 'discord.js';
import { Option, option } from 'ts-option';
import { env } from '@sjbha/app';

/**
 * Fetches members from an array of IDs, 
 * and then provides a lookup table for their nicknames
 */
export class MemberList {
  private constructor (
    private members: Discord.Collection<string, Discord.GuildMember>
  ) {}

  get = (discordId: string) : Option<Discord.GuildMember> => 
    option (this.members.get (discordId));

  nickname = (discordId: string, orDefault = 'unknown') : string =>
    option (this.members.get (discordId))
      .map (m => m.displayName)
      .getOrElse (() => orDefault);

  static fetch = async (client: Discord.Client, discordIds: string[]) : Promise<MemberList> => {
    try {
      const guild = await client.guilds.fetch (env.SERVER_ID);
      const members = await guild.members.fetch ({ user: discordIds });
      
      return new MemberList (members);
    }
    catch (e) {
      console.error ('Failed to fetch member list');
      console.error (e);

      return new MemberList (new Discord.Collection ());
    }
  }
}