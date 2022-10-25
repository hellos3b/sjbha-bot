import * as Discord from "discord.js";
import { Option, option } from "ts-option";
import { logger } from "../logger";

const log = logger ("utils:member-list");
const MAX_FETCHABLE = 99;

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

  nickname = (discordId: string, orDefault = "unknown") : string =>
     option (this.members.get (discordId))
        .map (m => m.displayName)
        .getOrElse (() => {
           log.debug ("Unable to find display name for member", { discordId });
           return orDefault;
        });

  static fetch = async (client: Discord.Client, discordIds: string[]) : Promise<MemberList> => {
     try {
        const guild = await client.guilds.fetch (process.env.SERVER_ID);
        let members = new Discord.Collection<string, Discord.GuildMember> ();

        for (let i = 0; i < discordIds.length; i += MAX_FETCHABLE) {
           const ids = discordIds.slice (i, i + MAX_FETCHABLE);
           const page = await guild.members.fetch ({ user: ids });
           members = members.concat (page);
        }
      
        return new MemberList (members);
     }
     catch (e) {
        log.error ("Failed to fetch member list", e);
        return new MemberList (new Discord.Collection ());
     }
  }
}