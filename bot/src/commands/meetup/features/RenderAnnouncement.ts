import { Message, MessageActionRow, MessageButton, MessageEmbed, MessageOptions, Client, MessageEditOptions } from 'discord.js';
import { DateTime } from 'luxon';

import { MemberList } from '@sjbha/utils/MemberList';
import * as Format from '@sjbha/utils/Format';
import * as Env from '@sjbha/app/env';
import * as db from '../db/meetups';
import { option } from 'ts-option';

const RsvpButton = new MessageButton()
  .setCustomId('rsvp')
  .setLabel('Going!')
  .setStyle('SUCCESS');

const MaybeButton = new MessageButton()
  .setCustomId('maybe')
  .setLabel('Interested')
  .setStyle('SECONDARY');

const RemoveButton = new MessageButton()
  .setCustomId('remove')
  .setLabel('❌')
  .setStyle('SECONDARY');

const actions = new MessageActionRow().addComponents(RsvpButton, MaybeButton, RemoveButton);

const linkify = (url: string, name?: string): string =>
  (!name) ? url : `[${name}](${url})`;

const mapsLink = (query: string): string => {
  const encoded = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

const gcalLink = (meetup: db.Meetup): string => {
  const encodeDate = (timestamp: DateTime) =>
    timestamp.toISO().replace(/(-|:|\.)/g, '');

  const ts = DateTime.fromISO(meetup.timestamp);

  const options = {
    action: 'TEMPLATE',
    text: meetup.title,
    dates: encodeDate(ts) + '/' + encodeDate(ts.plus({ hour: 2 })),
    // todo: details can break if the description is long
    // see: https://github.com/hellos3b/sjbha-bot/issues/135
    // details:  meetup.description,
    location: option(meetup.location)
      .filter(loc => loc.autoLink)
      .map(loc => loc.value)
      .getOrElseValue(''),
    trp: true
  }

  const query = Object.entries(options)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return `https://calendar.google.com/calendar/render?${query}`;
}

/**
 * This is the Announcement embed
 * 
 * @param meetup 
 * @param reactions 
 * @returns 
 */
function Announcement(meetup: db.Meetup, rsvps?: string[], maybes?: string[]): MessageEmbed {
  const embed = new MessageEmbed({
    title: meetup.title,
    description: meetup.description,
    color: '#9b3128'
  });

  embed.addField('Organizer', `<@${meetup.organizerID}>`);

  if (meetup.location) {
    const locationText = (meetup.location.autoLink)
      ? linkify(mapsLink(meetup.location.value), meetup.location.value)
      : meetup.location.value;

    embed.addField('Location', locationText + '\n' + meetup.location.comments);
  }

  embed.addField('Time', Format.time(
    DateTime.fromISO(meetup.timestamp),
    Format.TimeFormat.Full
  ));

  embed.addField('Links', [
    ...meetup.links.map(l => linkify(l.url, l.label)),
    linkify(`${Env.HAPI_HOST}/meetup/${meetup.id}/gcal`, 'Add to Google Calendar'),
  ].join('\n'));

  const withCount = (count: number) =>
    (count > 0) ? `(${count})` : '';

  rsvps && embed.addField(
    `✅ Attending ${withCount(rsvps.length)}`,
    (rsvps.length)
      ? rsvps.map(name => `> ${name}`).join('\n')
      : '-',
    true
  );

  maybes && embed.addField(
    `🤔 Interested ${withCount(maybes.length)}`,
    (maybes.length)
      ? maybes.map(name => `> ${name}`).join('\n')
      : '-',
    true
  );

  return embed;
}


export const render = async (client: Client, meetup: db.Meetup): Promise<Message> => {
  const announcement = await (async (): Promise<MessageOptions> => {
    switch (meetup.state.type) {
      case 'Live': {
        const members =
          await MemberList.fetch(client, [
            ...meetup.rsvps,
            ...meetup.maybes
          ]);

        const embed = Announcement(
          meetup,
          meetup.rsvps.map(id => members.nickname(id)),
          meetup.maybes.map(id => members.nickname(id)),
        );

        return {
          embeds: [embed],
          components: [actions]
        };
      }

      case 'Cancelled': {
        const embed = new MessageEmbed({
          title: `**CANCELLED**: ~~${meetup.title}~~`,
          color: '#9b3128',
          description: `> ${meetup.state.reason}`
        });

        return { embeds: [embed], components: [] };
      }

      case 'Ended': {
        const embed = new MessageEmbed({
          color: '#9b3128',
          description: `*${meetup.title} has ended*`
        });

        return { embeds: [embed], components: [] };
      }
    }
  })();

  try {
    const thread = await client.channels.fetch(meetup.threadID);

    if (!thread?.isThread()) {
      throw new Error(`Channel with id '${meetup.threadID}' does not exist or is not a thread`);
    }

    thread.archived && await thread.setArchived(false);

    if (meetup.announcementID) {
      const message = await thread.messages.fetch(meetup.announcementID);
      await message.edit(announcement as MessageEditOptions);

      return message;
    }
    else {
      const message = await thread.send(announcement);

      return message;
    }
  }
  catch (e) {
    const message = (e instanceof Error)
      ? e.message
      : 'Unknown Error';

    throw new Error(`Failed to render() meetup '${meetup.title}' because: ${message}`);
  }
}


export async function refresh(client: Client): Promise<void> {
  const meetups = await db.find({
    'state.type': 'Live'
  });

  meetups.forEach(meetup => render(client, meetup));
}

export const init = async (client: Client): Promise<void> => {
  await refresh(client);

  db.events.on('update', meetup => render(client, meetup));
}