import { MessageEmbed } from 'discord.js';
import { DateTime } from 'luxon';
import * as db from '../db/meetups';

const linkify = (url: string, name?: string) : string =>
  (!name) ? url : `[${name}](${url})`;

export type Reaction = {
  emoji: string;
  name: string;
  users: string[];
}

/**
 * This is the Announcement embed
 * 
 * @param meetup 
 * @param reactions 
 * @returns 
 */
export function Announcement (meetup: db.Meetup, reactions: Reaction[]) : MessageEmbed {
  const embed = new MessageEmbed ({
    title:       '📅  ' + meetup.title,
    description: meetup.description,
    color:       '#9b3128'
  });

  embed.addField ('Organized By', `<@${meetup.organizerID}>`);

  switch (meetup.location.type) {
    case 'Address': {
      const encoded = encodeURIComponent (meetup.location.value);
      embed.addField ('Location', linkify (`https://www.google.com/maps/search/?api=1&query=${encoded}`, meetup.location.value) + `\n${meetup.location.comments}`);
      break;
    }

    case 'Private':
      embed.addField ('Location', `${meetup.location.value}\n${meetup.location.comments}`);
      break;

    case 'Voice':
      embed.addField ('Location', 'Voice Chat');
      break;
  }

  embed.addField ('Time', DateTime.fromISO (meetup.timestamp).toLocaleString ({
    weekday: 'long', month:   'long',  day:     '2-digit', 
    hour:    '2-digit', minute:  '2-digit' 
  }))


  embed.addField ('Links', [
    ...meetup.links.map (l => linkify (l.url, l.label)),
    linkify ('https://www.google.com', 'Add to Google Calendar'),
  ].join ('\n'));

  reactions.forEach (reaction => {
    const label = `${reaction.emoji} ${reaction.name}`;

    if (!reaction.users.length) {
      embed.addField (label, '-', true);
    }
    else {
      embed.addField (`${label} (${reaction.users.length})`, reaction.users.join ('\n'), true);
    }
  });

  return embed;
}