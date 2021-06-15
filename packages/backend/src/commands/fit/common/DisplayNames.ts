import { Instance, Member } from '@sjbha/app';
import { Maybe } from 'purify-ts';

/**
 * Fetches members from an array of IDs, 
 * and then provides a lookup table for their nicknames
 */
export class DisplayNames {
  private memberById = new Map<string, Member> ();

  /** When discord fails to find a member, use this for the default nickname */
  defaultName = 'none';

  private constructor (members: Member[]) {
    members.forEach (member => {
      this.memberById.set (member.id, member);
    });
  }

  get = (discordId: string) : string =>
    Maybe
      .fromNullable (this.memberById.get (discordId))
      .mapOrDefault (m => m.nickname, this.defaultName);

  static fetch = async (discordIds: string[]) : Promise<DisplayNames> => {
    const members = await Promise
      .all (discordIds.map (id => Instance.fetchMember (id).catch (_ => null)))
      .then (m => m.filter ((member): member is Member => !!member));

    return new DisplayNames (members);
  }
}