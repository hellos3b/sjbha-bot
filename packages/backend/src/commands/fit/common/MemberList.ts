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
    const members = await Promise
      .all (discordIds.map (id => Instance.fetchMember (id).catch (_ => null)))
      .then (m => m.filter ((member): member is Member => !!member));

    return new MemberList (members);
  }
}