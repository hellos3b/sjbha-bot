import { 
  Message, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  MessageOptions, 
  Client, 
  MessageEditOptions 
} from 'discord.js';
import { DateTime } from 'luxon';

import { MemberList } from '@sjbha/utils/MemberList';
import * as Format from '@sjbha/utils/Format';
import * as Env from '@sjbha/app/env';
import * as db from '../db/meetups';

const max_name_count = 80;

const RsvpButton = new ButtonBuilder ()
  .setCustomId ('rsvp')
  .setLabel ('Going!')
  .setStyle (ButtonStyle.Success);

const MaybeButton = new ButtonBuilder ()
  .setCustomId ('maybe')
  .setLabel ('Interested')
  .setStyle (ButtonStyle.Secondary);

const RemoveButton = new ButtonBuilder ()
  .setCustomId ('remove')
  .setLabel ('❌')
  .setStyle (ButtonStyle.Secondary);

const actions = new ActionRowBuilder<ButtonBuilder> ()
  .addComponents (RsvpButton, MaybeButton, RemoveButton);

const linkify = (url: string, name?: string): string =>
  (!name) ? url : `[${name}](${url})`;

const mapsLink = (query: string): string => {
  const encoded = encodeURIComponent (query);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

// const gcalLink = (meetup: db.Meetup): string => {
//   const encodeDate = (timestamp: DateTime) =>
//     timestamp.toISO ().replace (/(-|:|\.)/g, '');

//   const ts = DateTime.fromISO (meetup.timestamp);

//   const options = {
//     action:   'TEMPLATE',
//     text:     meetup.title,
//     dates:    encodeDate (ts) + '/' + encodeDate (ts.plus ({ hour: 2 })),
//     // todo: details can break if the description is long
//     // see: https://github.com/hellos3b/sjbha-bot/issues/135
//     // details:  meetup.description,
//     location: option (meetup.location)
//       .filter (loc => loc.autoLink)
//       .map (loc => loc.value)
//       .getOrElseValue (''),
//     trp: true
//   }

//   const query = Object.entries (options)
//     .map (([key, value]) => `${key}=${encodeURIComponent (value)}`)
//     .join ('&');

//   return `https://calendar.google.com/calendar/render?${query}`;
// }

const capArray = (arr: string[], count: number) => 
  (arr.length <= count)
    ? arr
    : arr.slice (0, count).concat ([`*(+ ${arr.length - count} more)*`]);

/**
 * This is the Announcement embed
 */
function Announcement(meetup: db.Meetup, rsvps?: string[], maybes?: string[]): EmbedBuilder {
  const embed = new EmbedBuilder ({
    title:       meetup.title,
    description: meetup.description,
    color:       10170664
  });

  embed.addFields ({
    name:  'Organizer', 
    value: `<@${meetup.organizerID}>`
  });

  if (meetup.location) {
    const locationText = (meetup.location.autoLink)
      ? linkify (mapsLink (meetup.location.value), meetup.location.value)
      : meetup.location.value;

    embed.addFields ([{ name: 'Location', value: locationText + '\n' + meetup.location.comments }]);
  }

  embed.addFields ({
    name:  'Time', 
    value: Format.time (
      DateTime.fromISO (meetup.timestamp),
      Format.TimeFormat.Full
    )
  });

  embed.addFields ({
    name:  'Links', 
    value: [
      ...meetup.links.map (l => linkify (l.url, l.label)),
      linkify (`${Env.HAPI_HOST}/meetup/${meetup.id}/gcal`, 'Add to Google Calendar'),
    ].join ('\n')
  });

  const withCount = (count: number) =>
    (count > 0) ? `(${count})` : '';

  rsvps && embed.addFields ({
    name:  `✅ Attending ${withCount (rsvps.length)}`,
    value: (rsvps.length)
      ? capArray (rsvps, max_name_count).map (name => `> ${name}`).join ('\n')
      : '-',
    inline: true
  });

  maybes && embed.addFields ({
    name:  `🤔 Interested ${withCount (maybes.length)}`,
    value: (maybes.length)
      ? capArray (maybes, max_name_count).map (name => `> ${name}`).join ('\n')
      : '-',
    inline: true
  });

  return embed;
}


export const render = async (client: Client, meetup: db.Meetup): Promise<Message> => {
  const announcement = await (async (): Promise<MessageOptions> => {
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
        const embed = new EmbedBuilder ({
          title:       `**CANCELLED**: ~~${meetup.title}~~`,
          color:       10170664,
          description: `> ${meetup.state.reason}`
        });

        return { embeds: [embed], components: [] };
      }

      case 'Ended': {
        const embed = new EmbedBuilder ({
          color:       10170664,
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
      await message.edit (announcement as MessageEditOptions);

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


export async function refresh(client: Client): Promise<void> {
  const meetups = await db.find ({
    'state.type': 'Live'
  });

  meetups.forEach (meetup => render (client, meetup));
}

export const init = async (client: Client): Promise<void> => {
  await refresh (client);

  db.events.on ('update', meetup => render (client, meetup));
}