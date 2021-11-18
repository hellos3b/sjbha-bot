import { Message, MessageActionRow, MessageButton, MessageEmbed, MessageOptions, Client } from 'discord.js';
import { DateTime } from 'luxon';

import { MemberList } from '@sjbha/utils/MemberList';
import * as db from '../db/meetups';

const RsvpButton = new MessageButton ()
  .setCustomId ('rsvp')
  .setLabel ('Going!')
  .setStyle ('SUCCESS');

const MaybeButton = new MessageButton ()
  .setCustomId ('maybe')
  .setLabel ('Maybe')
  .setStyle ('SECONDARY');

const RemoveButton = new MessageButton ()
  .setCustomId ('remove')
  .setLabel ('❌')
  .setStyle ('SECONDARY');

const actions = new MessageActionRow ().addComponents (RsvpButton, MaybeButton, RemoveButton);

const linkify = (url: string, name?: string) : string =>
  (!name) ? url : `[${name}](${url})`;

export const init = async (client: Client) : Promise<void> => {
  await refresh (client);

  db.events.on ('update', () => render);
}

export async function refresh (client: Client) : Promise<void> {
  const meetups = await db.find ({
    'state.type': 'Live'
  });
  
  meetups.forEach (meetup => render (client, meetup));  
}

export const render = async (client: Client, meetup: db.Meetup) : Promise<Message> => {
  const announcement = await (async () : Promise<MessageOptions> => {
    switch (meetup.state.type) {
      case 'Live': {
        const members = 
          await MemberList.fetch (client, [
            ...meetup.rsvps,
            ...meetup.maybes
          ]);

        const embed = Announcement (
          meetup,
          meetup.rsvps.map (id => members.nickname (id)),
          meetup.maybes.map (id => members.nickname (id)),
        );

        return {
          embeds:     [embed],
          components: [actions]
        };
      }

      case 'Cancelled': {
        const embed = new MessageEmbed ({
          title:       `**CANCELLED**: ~~${meetup.title}~~`,
          color:       '#9b3128',
          description: `> ${meetup.state.reason}`
        });

        return { embeds: [embed], components: [] };
      }

      case 'Ended': {
        const embed = new MessageEmbed ({
          color:       '#9b3128',
          description: `*${meetup.title} has ended*`
        });

        return { embeds: [embed], components: [] };
      }
    }
  }) ();

  try {
    const thread = await client.channels.fetch (meetup.threadID);

    if (!thread?.isThread ()) {
      throw new Error (`Channel with id '${meetup.threadID}' does not exist or is not a thread`);
    }

    thread.archived && await thread.setArchived (false);

    if (meetup.announcementID) {
      const message = await thread.messages.fetch (meetup.announcementID);
      await message.edit (announcement);

      return message;
    }
    else {
      const message = await thread.send (announcement);

      return message;
    }
  }
  catch (e) {
    const message = (e instanceof Error)
      ? e.message
      : 'Unknown Error';

    throw new Error (`Failed to render() meetup '${meetup.title}' because: ${message}`);
  }
}

/**
 * This is the Announcement embed
 * 
 * @param meetup 
 * @param reactions 
 * @returns 
 */
function Announcement (meetup: db.Meetup, rsvps?: string[], maybes?: string[]) : MessageEmbed {
  const embed = new MessageEmbed ({
    title:       meetup.title,
    description: meetup.description,
    color:       '#9b3128'
  });

  embed.addField ('Organizer', `<@${meetup.organizerID}>`);

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

  const withCount = (count: number) => 
    (count > 0) ? `(${count})` : '';

  rsvps && embed.addField (
    `✅ Attending ${withCount (rsvps.length)}`,
    (rsvps.length)
      ? rsvps.map (name => `> ${name}`).join ('\n')
      : '-',
    true
  );

  maybes && embed.addField (
    `🤔 Maybe ${withCount (maybes.length)}`,
    (maybes.length)
      ? maybes.map (name => `> ${name}`).join ('\n')
      : '-',
    true
  );

  return embed;
}