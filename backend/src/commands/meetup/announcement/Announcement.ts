import { Collection, Message } from 'discord.js';
import { isType, match } from 'variant';

import { Instance } from '@sjbha/app';

import * as Emojis from '../common/emojis';
import * as db from '../db/meetups';

import RsvpManager from './RsvpManager';
import AnnouncementEmbed, { Reaction } from './AnnouncementEmbed';

/**
 * Represents the meetup announcement, keeps track of RSVPs and managing the message object
 */
export default class Announcement {
  private meetup: db.Meetup;

  private readonly message: Message;

  private readonly rsvps: RsvpManager;

  private constructor(meetup: db.Meetup, rsvps: RsvpManager, message: Message) {
    this.meetup = meetup;
    this.rsvps = rsvps;
    this.message = message;

    this.render ();
    rsvps.events.on ('change', () => this.render ());
  }

  async render() : Promise<void> {
    const embed = AnnouncementEmbed.create (this.meetup, []);

    await this.message.edit (embed);
  }

  async update (meetup: db.Meetup) : Promise<void> {
    this.meetup = meetup;
    await this.render ();
  }

  /**
   * Post a new meetup to a channel
   * 
   * @param channelId The channel the meetup should be posted in
   * @param props The options for creating a meetup
   */
  static async post (data: db.Meetup) : Promise<Announcement> {
    const state = data.announcement;

    if (!isType (state, db.AnnouncementType.Pending))
      throw new Error ('Meetup is already posted and cant be posted again');

    const embed = AnnouncementEmbed.create (data, [
      Reaction (Emojis.RSVP, 'Attending', new Collection ()),
      Reaction (Emojis.Maybe, 'Maybe', new Collection ())
    ]);

    const message = await Instance
      .fetchChannel (state.channelId)
      .then (c => c.send (embed));

    const meetup = await db.update ({
      ...data,
      announcement: db.AnnouncementType.Inline (message.channel.id, message.id)
    });

    const rsvps = await RsvpManager.fromMessage (message);

    return new Announcement (meetup, rsvps, message);
  }
}