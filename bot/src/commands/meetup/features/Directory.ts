import * as Discord from 'discord.js';
import { DateTime } from 'luxon';

import { env, Settings, Log } from '../../../app';
import { channels } from '../../../server';
import * as Format from '../../../utils/Format';

import * as db from '../db/meetups';

const log = Log.make ('meetup:directory');
const settingsKey = 'meetup/directory-ids';
const max_description_length = 120;

const intro = `
**Welcome to <#${channels.meetups_directory}>!**

This channel lists a short overview of all the upcoming meetups. 
Full descriptions and meetup discussions occur inside of threads, just click on a link below to get taken to that meetup's thread.

**Who runs meetups?**
Meetups on this server are community driven and can be created by any member. We just provide a way to help organize.

**How do I join a meetup?**
Head over to the meetup thread and click the RSVP button

**How do I create a meetup?**
Head over to <#${channels.meetups}> and run the \`!meetup\` command, and you will be given a link to a form to fill out. 
`;

const getDirectoryChannel = async (client: Discord.Client) => {
  const channel = await client.channels.fetch (channels.meetups_directory);

  if (channel?.type !== Discord.ChannelType.GuildText) {
    throw new Error ('Could not fetch meetups_directory channel');
  }

  return channel;
}

const postOrEdit = async (client: Discord.Client, messageOptions: Discord.MessageOptions, messageId?: string) => {
  const channel = await getDirectoryChannel (client);

  if (messageId) {
    const message = await channel.messages.fetch (messageId);
    await message.edit (messageOptions as Discord.MessageEditOptions);
    return messageId;
  }
  else {
    const message = await channel.send (messageOptions);
    return message.id;
  }
}

const deleteMessage = async (client: Discord.Client, messageId: string) => {
  const channel = await getDirectoryChannel (client);
  const message = await channel.messages.fetch (messageId);
  return message.delete ();
}

const truncate = (str: string, len: number) =>
  (str.length > len)
    ? str.substring (0, len) + '...'
    : str;

const plural = (count: number, single: string, plural: string) =>
  (count === 1) 
    ? `1 ${single}`
    : `${count} ${plural}`;

// Creates the individual embeds that are used in the directory channel
function DirectoryEmbed(meetup: db.Meetup): Discord.EmbedBuilder {
  const link = `https://discord.com/channels/${env.SERVER_ID}/${meetup.threadID}/${meetup.announcementID}`;

  switch (meetup.state.type) {
    case 'Cancelled':
      return new Discord.EmbedBuilder ({
        description: `**${meetup.title}** was cancelled:\n> *${meetup.state.reason}*\n[Link to Thread](${link})`,
        color:       0x454545
      });

    case 'Live': {
      // How long ago the meetup was created
      const age = DateTime.local ()
        .diff (DateTime.fromISO (meetup.createdAt), 'hours')
        .toObject ();

      const isNew = age.hours && age.hours < 24;

      const fullTime = Format.time (
        DateTime.fromISO (meetup.timestamp),
        Format.TimeFormat.Full
      );

      const relativeTime = Format.time (
        DateTime.fromISO (meetup.timestamp),
        Format.TimeFormat.Relative
      );

      const emoji = {
        food:      '🍔',
        drinks:    '🍺',
        fitness:   '💪',
        voice:     '🔊',
        gaming:    '🎮',
        outdoors:  '🌲',
        concert:   '🎵',
        holiday:   '🎉',
        volunteer: '🎗️',
        pet:       '🐕'
      }[meetup.category] || '🗓️';

      const description = [
        `**${emoji} ${meetup.title}**`,
        ' ',
        truncate (meetup.description, max_description_length),
        ' ',
        `🙋 Organized by <@${meetup.organizerID}>`,
        `✅ ${plural (meetup.rsvps.length, 'person is', 'people are')} attending`,
        `🕑 ${fullTime} (${relativeTime})`,
        `📨 [Click here for full details and to RSVP](${link})`
      ].join ('\n');
      
      const embed = new Discord.EmbedBuilder ({
        'color':       (isNew) ? 0xe04007 : 0xeeeeee,
        'description': description
      });

      isNew && embed.setThumbnail ('https://imgur.com/aeovsXo.png');

      return embed;
    }

    case 'Ended':
      throw new Error ('Ended meetups should not show up in directory');
  }
}


const findDirectoryMeetups = (): Promise<db.Meetup[]> => {
  const beginning =
    DateTime
      .local ()
      .set ({ hour: 0, minute: 0, second: 0 })
      .toISO ();

  return db.find ({
    $or: [
      {
        'state.type': 'Live',
        timestamp:    { $gt: beginning },
      },

      {
        'state.type':      'Cancelled',
        'state.timestamp': { $gt: beginning }
      }
    ]
  });
}

const refreshFromScratch = async (client: Discord.Client) => {
  log.debug ('There may be an issue with the message IDs stored, so we are going to reinitialize the directory channel');
  const messageIds = await Settings.get<string[]> (settingsKey, []);
  const channel = await getDirectoryChannel (client);

  const deleted = messageIds.map (id => 
    channel.messages.fetch (id)
      .then (msg => msg.delete ())
      .catch (_ => null)
  );

  try {
    await Promise.all (deleted);
    await Settings
      .save (settingsKey, [])
      .catch (_ => { throw new Error ('Failed to save'); });

    return refresh (client);
  }
  catch (err) {
    const message = (err instanceof Error) ? err.message : 'Unknown';
    throw new Error (`Failed to reset meetup directory, abandoning. Check the message ids in settings. Error: ${message}`);
  }
}

// fetch all meetups from the DB
// and update the directory channel in chronological order
export const refresh = async (client: Discord.Client, repost = false): Promise<void> => {
  const meetups = await findDirectoryMeetups ();
  const messageIds = await Settings.get<string[]> (settingsKey, []);
  const usedIds: string[] = [];

  log.debug ('Meetups in directory', { count: meetups.length });

  try {
    // Post introduction message
    const introId = await postOrEdit (
      client,
      { content: intro, embeds: [] },
      messageIds.shift ()
    ).catch (_ => null);

    if (!introId) {
      throw new Error ('Failed to edit introduction message');
    }

    usedIds.push (introId);


    // Take down the existing messages and repost
    // so that people get notified of a new update on discord
    if (repost) {
      log.debug ('Deleting old messages to repost');
      const channel = await getDirectoryChannel (client);

      while (messageIds.length) {
        const id = messageIds.shift ();
        id && await channel.messages.fetch (id).then (msg => msg.delete ());
      }
    }

    // Post 10 directory postings per message until all are used up
    const embeds = meetups
      .sort ((a, b) => a.timestamp > b.timestamp ? 1 : -1)
      .map (DirectoryEmbed);

    while (embeds.length) {
      const group = embeds.splice (0, 10);
      const id = await postOrEdit (client, { embeds: group }, messageIds.shift ());
      usedIds.push (id);
    }

    // Get rid of any ones we haven't used yet
    await Promise.all (
      messageIds.map (leftover => deleteMessage (client, leftover))
    );

    await Settings.save (settingsKey, usedIds);
  }
 catch (err) {
    log.error ('Ran into an issue while refreshing meetups redirectory, will atempt to recreate from scratch');
    return refreshFromScratch (client);
  }
}

// Meant to be called when booting up
export const startListening = async (client: Discord.Client): Promise<void> => {
  let task = Log.runWithContext (() => {
    log.info ('Initializing directory on startup');
    return refresh (client);
  });

  db.events.on ('update', meetup => {
    Log.runWithContext (() => {
      log.info ('A meetup was updated', { id: meetup.id, title: meetup.title });
      const prev = task;
      task = prev.then (() => refresh (client, false));
    });
  });

  db.events.on ('add', meetup => {
    Log.runWithContext (() => {
      log.info ('A meetup was added', { id: meetup.id, title: meetup.title });
      const prev = task;
      task = prev.then (() => refresh (client, true));
    });
  });
}
