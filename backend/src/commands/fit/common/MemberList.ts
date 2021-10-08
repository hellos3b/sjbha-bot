import { Instance, Member } from '@sjbha/app';
import { Maybe } from 'purify-ts';

/**
 * Fetches members from an array of IDs, 
 * and then provides a lookup table for their nicknames
 */
export class MemberList {
  private memberById = new Map<string, Member> ();

  private constructor (members: Member[]) {
    members.forEach (member => {
      this.memberById.set (member.id, member);
    });
  }

  get = (discordId: string) : Maybe<Member> => 
    Maybe.fromNullable (this.memberById.get (discordId));

  nickname = (discordId: string, orDefault = 'unknown') : string =>
    Maybe
      .fromNullable (this.memberById.get (discordId))
      .mapOrDefault (m => m.nickname, orDefault);

  static fetch = async (discordIds: string[]) : Promise<MemberList> => {
    const members = await Instance.fetchMembers (discordIds).catch (e => {
      console.error ('Failed to fetch member list');
      console.error (e);

      return [] as Member[];
    });

    return new MemberList (members);
  }
}