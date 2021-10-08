import { Collection, MessageEmbed } from 'discord.js';
import { none, Option, option } from 'ts-option';
import { isType, just, match } from 'variant';
import * as db from '../db/meetups';
import Participant from './Participant';


const linkify = (url: string, name?: string) : string =>
  (!name) ? url : `[${name}](${url})`;

export type Reaction = {
  emoji: string;
  name: string;
  users: Collection<string, Participant>;
}

export const Reaction = (emoji: string, name: string, users: Collection<string, Participant>): Reaction =>
  ({ emoji, name, users });

const embedColor = '#9b3128';

/**
 * Represents the meetup announcement, and should be regarded as the source of truth for meetup data
 */
export default class AnnouncementEmbed {

  private meetup: db.Meetup;

  private reactions: Reaction[];

  get title() : string {
    return this.meetup.details.title;
  }

  get time() : string {
    return this.meetup.details.timestamp.toLocaleString ({ 
      weekday: 'long', month:   'long',  day:     '2-digit', 
      hour:    '2-digit', minute:  '2-digit' 
    });
  }

  get location() : Option<string> {
    if (isType (this.meetup.details.location, db.Location.None))
      return none;

    const comments = match (this.meetup.details.location, {
      Address: ({ comments }) => comments ? '\n' + comments : '',
      Private: ({ comments }) => comments ? '\n' + comments : '',
      Voice:   just ('')
    });

    const value =  match (this.meetup.details.location, {
      Address: ({ value }) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent (value)}`,
      Private: ({ value }) => value,
      Voice:   just ('Voice Chat')
    });

    return option (value + comments);
  }

  get links(): string {
    const userlinks = this.meetup.details.links.map (link => linkify (link.url, link.name));
    const gcalLink = linkify ('https://www.google.com', 'Add to Google Calendar');

    return [...userlinks, gcalLink].join ('\n');
  }

  private constructor(meetup: db.Meetup, reactions: Reaction[]) {
    this.meetup = meetup;
    this.reactions = reactions;
  }

  private render() : MessageEmbed {
    return match (this.meetup.state, {
      Created:   _ => this.announcement (),
      Cancelled: ({ reason }) => this.cancelledAnnouncement (reason),
      // todo: Update to a different design
      Ended:     _ => this.announcement ()
    })
  }
  
  private announcement() : MessageEmbed {
    const meetup = this.meetup;
  
    const reactions = this.reactions.map (reaction => {
      let name = `${reaction.emoji} ${reaction.name}`;

      const users = reaction.users.mapValues (u => u.nickname).array ();
      const value = (users.length)
        ? users.join ('\n')
        : '-';

      if (users.length) {
        name += ` (${users.length})`;
      }

      return { name, value, inline: true }
    });

    return new MessageEmbed ({
      title:       '📅  ' + meetup.details.title,
      description: meetup.details.description,
      color:       embedColor,
      
      fields: [
        { 
          name:   'Organized By', 
          value:  `<@${this.meetup.details.organizerId}>`, 
          inline: true 
        },

        ...(this.location.map (value => [{ 
          name: 'Location', 
          value 
        }]).getOrElse (() => [])),

        { name: 'Time', value: this.time },
        { name: 'Links',  value: this.links },
        ...reactions
      ]
    })
  }

  private cancelledAnnouncement(reason: string) : MessageEmbed {
    return new MessageEmbed ({
      title:       '📅  **CANCELLED**: ~~' + this.title + '~~',
      color:       embedColor,
      description: `> ${reason}`
    });
  }

  static create (meetup: db.Meetup, reactions: Reaction[]) : MessageEmbed {
    return new AnnouncementEmbed (meetup, reactions).render ();
  }
}