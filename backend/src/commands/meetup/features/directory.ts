import { MessageEmbed, MessageOptions } from 'discord.js';
import { DateTime } from 'luxon';

import { env, Instance, onClientReady, onMongoDbReady, Settings } from '@sjbha/app';
import { channels } from '@sjbha/config';
import { queued } from '@sjbha/utils/queue';

import * as db from '../db/meetups';

const MessageIds = Settings<string[]> ('meetup/directory-ids', []);

const intro = `
**Welcome to <#${channels.meetups_directory}>!**

Meetups are created by members, and are open to all for joining! Click on the links to see full descriptions, location information, and always remember to RSVP!
`;

// Meant to be called when booting up
export async function init() : Promise<void> {
  await Promise.all ([onClientReady, onMongoDbReady]);
  await refresh ();

  db.events.on ('add', runRefresh);
  db.events.on ('update', runRefresh);
}

export const runRefresh = queued (refresh);

// fetch all meetups from the DB
// and update the directory channel in chronological order
async function refresh () {
  const models = await db.find ({ 
    timestamp: { 
      $gt: DateTime
        .local ()
        .set ({ hour: 0, minute: 0, second: 0 })
        .toISO () 
    } 
  });

  const meetups = models
    .sort ((a, b) => a.timestamp.localeCompare (b.timestamp))
    .filter (meetup => {
      if (meetup.state.type === 'Cancelled') {
        const diff = DateTime.local ()
          .diff (DateTime.fromISO (meetup.state.timestamp), 'hours')
          .toObject ();

        // Hide cancelled meetups 24 hours after being cancelled
        return (diff.hours && diff.hours <= 24)
      }
      else {
        return meetup.state.type !== 'Ended';
      }
    });

  const messageIds = await MessageIds.get ();
  const usedIds : string[] = [];

  // Post introduction message
  const introId = await postOrEdit (
    { content: intro, embeds: [] }, 
    messageIds.shift ()
  );

  usedIds.push (introId);


  // Post 10 directory postings per message until all are used up
  const embeds = meetups.map (DirectoryEmbed);

  while (embeds.length) {
    const group = embeds.splice (0, 10);
    const id = await postOrEdit ({ embeds: group }, messageIds.shift ());
    usedIds.push (id);
  }

  // Get rid of any ones we haven't used yet
  await Promise.all (
    messageIds.map (leftover => 
      Instance.fetchMessage (channels.meetups_directory, leftover)
        .then (message => message.delete ())
    )
  );

  await MessageIds.save (usedIds);
}


// Creates the individual embeds that are used in the directory channel
function DirectoryEmbed (meetup: db.Meetup) : MessageEmbed {
  const link = `https://discord.com/channels/${env.SERVER_ID}/${meetup.threadID}/${meetup.announcementID}`;

  switch (meetup.state.type) {
    case 'Cancelled': 
      return new MessageEmbed ({
        description: `**${meetup.title}** was cancelled:\n> *${meetup.state.reason}*\n[Link to Thread](${link})`,
        color:       0x454545
      });

    case 'Live': {
      // How long ago the meetup was created
      const age = DateTime.local ()
        .diff (DateTime.fromISO (meetup.createdAt), 'hours')
        .toObject ();

      const isNew = age.hours && age.hours < 24;

      const timestamp = DateTime.fromISO (meetup.timestamp).toLocaleString ({
        weekday: 'long', month:   'long',  day:     '2-digit', 
        hour:    '2-digit', minute:  '2-digit' 
      });

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
  
      const embed = new MessageEmbed ({
        'color':       (isNew) ? 0xe04007 : 0xeeeeee,
        'description': `**${emoji} ${meetup.title}**\n${timestamp}\n[Click here to view details and to RSVP](${link})`
      });

      isNew && embed.setThumbnail ('https://imgur.com/aeovsXo.png');

      return embed;
    } 

    case 'Ended':
      throw new Error ('Ended meetups should not show up in directory');
  }
}

async function postOrEdit (payload: MessageOptions, id?: string) {
  if (id) {
    const message = await Instance.fetchMessage (channels.meetups_directory, id);
    await message.edit (payload);
    return id;
  }
  else {
    const channel = await Instance.fetchChannel (channels.meetups_directory);
    const message = await channel.send (payload);
    return message.id;
  }
}