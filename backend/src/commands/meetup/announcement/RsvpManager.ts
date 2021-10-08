import { Collection, Message, MessageReaction, ReactionCollector, User } from 'discord.js';
import { EventEmitter } from 'tsee';
import Participant from './Participant';
import * as Emojis from '../common/emojis';

/**
 * The RsvpManager's keeps track of which users RSVP to a meetup via the reactions
 * and enforces a policy that you either Rsvp or Maybe, but not both
 */
export default class RsvpManager {

  /** List of users who've reacted to one of the RSVP reactions */
  private readonly guestlist = new Collection<string, Participant> ();

  readonly events = new EventEmitter<{
    'change': () => void;
  }> ();

  /** Emits events based on new reactions */
  private collector? : ReactionCollector;

  private readonly yesEmoji: string;

  private readonly maybeEmoji: string;

  constructor (yesEmoji = Emojis.RSVP, maybeEmoji = Emojis.Maybe) {
    this.yesEmoji = yesEmoji;
    this.maybeEmoji = maybeEmoji;
  }
  
  /**
   * Collection of users who've reacted that they are "Attending"
   */
  get attendees() : Collection<string, Participant> {
    return this.guestlist.filter (u => u.isAttending);
  }

  /**
   * Collection of users who've reacted that they are a "Maybe"
   */
  get maybes() : Collection<string, Participant> {
    return this.guestlist.filter (u => u.isMaybe);
  }

  /**
   * Fetch existing reactions from an announcement or initialize them
   * Then sets up listeners for all future reactions
   */
  async init(message: Message) : Promise<void> {
    const yesReaction = 
      message.reactions.cache.get (this.yesEmoji)
      ?? await message.react (this.yesEmoji);

    const maybeReaction =
      message.reactions.cache.get (Emojis.Maybe)
      ?? await message.react (Emojis.Maybe);

    // When fetching reactions from an old message, the users aren't loaded into the cache by default
    await Promise.all ([
      yesReaction.users.fetch (),
      maybeReaction.users.fetch ()
    ]);

    
    // init the cache with the existing reactions
    const maybes = maybeReaction.users.cache.filter (u => !u.bot);
    const attending = yesReaction.users.cache.filter (u => !u.bot);

    for (const [_, user] of maybes) {
      await this.addParticipantToList (user, maybeReaction);
    }

    for (const [_, user] of attending) {
      await this.addParticipantToList (user, yesReaction);
    }


    // Setup a listener for future reactions
    this.collector = message.createReactionCollector (
      reaction => [this.yesEmoji, this.maybeEmoji].includes (reaction.emoji.name), 
      { dispose: true }
    );

    this.collector.on ('collect', this.handleCollect);
    this.collector.on ('remove', this.handleRemove);

    // todo: Check if this ever gets called, and maybe handle restart
    this.collector.on ('end', () => {
      console.log ('#end collection');
    });
  }

  //
  // Initialize a participant to a guest list.
  // Will switch a user from their current list to their new list if they're already RSVP'd on one
  //
  private async addParticipantToList(user: User, list: MessageReaction) : Promise<void> {
    const rsvp = this.guestlist.get (user.id);

    if (rsvp) {
      await rsvp.switchTo (list);
    }
    else {
      const participant = new Participant (user, list);
      this.guestlist.set (user.id, participant);
    }
  }

  //
  // Event handler for when a user adds a reaction
  //
  private handleCollect = async (reaction: MessageReaction, user: User) => {
    await this.addParticipantToList (user, reaction);
    this.events.emit ('change');
  }

  //
  // Event handler for when user removes a reaction
  //
  private handleRemove = async (reaction: MessageReaction, user: User) => {
    const rsvp = this.guestlist.get (user.id);

    if (rsvp && rsvp.isInList (reaction)) {
      this.guestlist.delete (user.id);
      this.events.emit ('change');
    }
  }

  static async fromMessage(message: Message) : Promise<RsvpManager> {
    const manager = new RsvpManager ();
    await manager.init (message);

    return manager;
  }
}
