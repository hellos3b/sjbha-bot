import { env, Instance, onClientReady, onMongoDbReady, Settings } from '@sjbha/app';
import { channels } from '@sjbha/config';
import { MessageEmbed } from 'discord.js';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';
import { DateTime } from 'luxon';
import { queued } from '@sjbha/utils/queue';

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
  const after = DateTime.local ()
    .set ({ hour: 0, minute: 0, second: 0 });
    
  const models = await db.find ({ timestamp: { $gt: after.toISO () } });

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
  const id = messageIds.shift ();
  const introId = await post (intro, id);
  usedIds.push (introId);


  // Post each meetup
  for (const meetup of meetups) {
    const id = messageIds.shift ();
    const usedId = await post (DirectoryEmbed (meetup), id);
    usedIds.push (usedId);
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
  switch (meetup.state.type) {
    case 'Cancelled': 
      return new MessageEmbed ({
        description: `**${meetup.title}** was cancelled:\n> *${meetup.state.reason}*`,
        color:       0x454545
      });

    case 'Live': {
      const link = `https://discord.com/channels/${env.SERVER_ID}/${meetup.threadID}/${meetup.announcementID}`;

      // How long ago the meetup was created
      const age = DateTime.local ()
        .diff (DateTime.fromISO (meetup.createdAt), 'hours')
        .toObject ();

      const isNew = age.hours && age.hours < 24;
  
      return new MessageEmbed ({
        'color':  (isNew) ? '#e04007' : '#eeeeee',
        'author': { 
          name:    meetup.title,
          iconURL: (isNew) ? 'https://imgur.com/hs5YKXS.png' : ''
        },
        'description': `${M.timestring (meetup)}\n[Click here to view details and to RSVP](${link})`
      });
    } 

    case 'Ended':
      throw new Error ('Ended meetups should not show up in directory');
  }
}

async function post (content: string | MessageEmbed, id?: string) {
  const sending = (typeof content === 'string')
    ? { content }
    : { embeds: [content] };

  if (id) {
    const message = await Instance.fetchMessage (channels.meetups_directory, id);
    await message.edit (sending);
    return id;
  }
  else {
    const channel = await Instance.fetchChannel (channels.meetups_directory);
    const message = await channel.send (sending);
    return message.id;
  }
}