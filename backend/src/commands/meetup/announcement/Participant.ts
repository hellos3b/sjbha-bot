import { MessageReaction, User } from 'discord.js';
import * as Emojis from '../common/emojis';

/**
 * A Participant is someone who's clicked one of the RSVP reactions on a meetup
 */
export default class Participant {
  private readonly user: User;

  private reactions: MessageReaction;

  constructor (user: User, list: MessageReaction) {
    this.user = user;
    this.reactions = list;
  }

  /**
   * Public nickname of the user
   */
  get nickname() : string {
    return this.user.username;
  }

  /**
   * `true` if user marked the "YES" emoji on the rsvp list
   */
  get isAttending() : boolean {
    return this.reactions.emoji.name === Emojis.RSVP;
  }

  /**
   * `true` if user marked the "MAYBE" emoji on the rsvp list
   */
  get isMaybe() : boolean {
    return this.reactions.emoji.name === Emojis.Maybe;
  }

  /**
   * Check if this user belongs to a list
   */
  isInList (reaction: MessageReaction) : boolean {
    return reaction.emoji.name === this.reactions.emoji.name;
  }

  /**
   * Removes the user's previous reaction when they're signing up for a new one
   * 
   * @param reactions 
   */
  async switchTo (reactions: MessageReaction) : Promise<void> {
    if (this.isInList (reactions)) {
      return;
    }

    // Discord fires a "remove" event before we get the chance to set the current reaction
    // so we'll set it first before deleting to prevent the race condition
    const oldReaction = this.reactions;
    this.reactions = reactions;

    await oldReaction.users.remove (this.user.id);
    oldReaction.users.cache.delete (this.user.id);
  }
}