import * as Discord from 'discord.js';
import { DateTime } from 'luxon';

import { env, Settings, Log } from '@sjbha/app';
import { channels } from '@sjbha/server';
import * as Format from '@sjbha/utils/Format';

import * as db from '../db/meetups';

const log = Log.make ('meetup:directory');
const settingsKey = 'meetup/directory-ids';

const intro = `
**Welcome to <#${channels.meetups_directory}>!**

Meetups are created by members, and are open to all for joining! Click on the links to see full descriptions, location information, and always remember to RSVP!
`;

const getDirectoryChannel = async (client: Discord.Client) => {
  const channel = await client.channels.fetch (channels.meetups_directory);

  if (!channel || !channel.isText ()) {
    throw new Error ('Could not fetch meetups_directory channel');
  }

  return channel;
}

const postOrEdit = async (client: Discord.Client, messageOptions: Discord.MessageOptions, messageId?: string) => {
  const channel = await getDirectoryChannel (client);

  if (messageId) {
    const message = await channel.messages.fetch (messageId);
    await message.edit (messageOptions);
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

// Creates the individual embeds that are used in the directory channel
function DirectoryEmbed (meetup: db.Meetup) : Discord.MessageEmbed {
  const link = `https://discord.com/channels/${env.SERVER_ID}/${meetup.threadID}/${meetup.announcementID}`;

  switch (meetup.state.type) {
    case 'Cancelled': 
      return new Discord.MessageEmbed ({
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
  
      const embed = new Discord.MessageEmbed ({
        'color':       (isNew) ? 0xe04007 : 0xeeeeee,
        'description': `**${emoji} ${meetup.title}**\n${fullTime} (${relativeTime})\n[Click here to view details and to RSVP](${link})`
      });

      isNew && embed.setThumbnail ('https://imgur.com/aeovsXo.png');

      return embed;
    } 

    case 'Ended': 
      throw new Error ('Ended meetups should not show up in directory');
  }
}


const findDirectoryMeetups = () : Promise<db.Meetup[]> => {
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

// fetch all meetups from the DB
// and update the directory channel in chronological order
export const refresh = async (client: Discord.Client, repost = false) : Promise<void> => {
  const meetups = await findDirectoryMeetups ();
  const messageIds = await Settings.get <string[]> (settingsKey, []);
  const usedIds : string[] = [];

  log.debug ('Meetups in directory', { count: meetups.length });

  // Post introduction message
  const introId = await postOrEdit (
    client,
    { content: intro, embeds: [] }, 
    messageIds.shift ()
  );

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

// Meant to be called when booting up
export const startListening = async (client: Discord.Client) : Promise<void> => {
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

  db.events.on ('add',  meetup => {
    Log.runWithContext (() => {
      log.info ('A meetup was added', { id: meetup.id, title: meetup.title });
      const prev = task;
      task = prev.then (() => refresh (client, true));
    });
  });
}
