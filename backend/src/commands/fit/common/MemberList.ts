import { Instance } from '@sjbha/app';
import { GuildMember } from 'discord.js';
import { Option, option } from 'ts-option';

/**
 * Fetches members from an array of IDs, 
 * and then provides a lookup table for their nicknames
 */
export class MemberList {
  private memberById = new Map<string, GuildMember> ();

  private constructor (members: GuildMember[]) {
    members.forEach (member => {
      this.memberById.set (member.id, member);
    });
  }

  get = (discordId: string) : Option<GuildMember> => 
    option (this.memberById.get (discordId));

  nickname = (discordId: string, orDefault = 'unknown') : string =>
    option (this.memberById.get (discordId))
      .flatMap (m => option (m.nickname))
      .getOrElse (() => orDefault);

  static fetch = async (discordIds: string[]) : Promise<MemberList> => {
    const members = await Instance.fetchMembers (discordIds).catch (e => {
      console.error ('Failed to fetch member list');
      console.error (e);

      return [] as GuildMember[];
    });

    return new MemberList (members);
  }
}