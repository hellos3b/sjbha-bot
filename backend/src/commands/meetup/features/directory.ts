import { Instance, onClientReady, onMongoDbReady, Settings } from '@sjbha/app';
import { channels } from '@sjbha/config';
import { MessageEmbed } from 'discord.js';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';
import { DateTime } from 'luxon';
import { refresh } from '../admin/refresh';

const MessageIds = Settings<string[]> ('meetup/directory-ids', []);

// To avoid a scenario where we're doing multiple refreshes in a row,
// -- for instance of two meetups were edited back to back --
// we'll keep track of if we're in the middle of refresing 
// and if so, queue one instead of running
enum RefreshState { None, Running, Queued }
let state = RefreshState.None;

const intro = `
**Welcome to <#${channels.meetups_directory}>!**

Meetups are created by members, and everyone is welcome to join.
Click on the links to see full descriptions, location information, and always remember to RSVP!
`;

// Meant to be called when booting up
export async function init() : Promise<void> {
  await Promise.all ([onClientReady, onMongoDbReady]);
  await refresh ();

  db.events.on ('add', queueRefresh);
  db.events.on ('update', queueRefresh);
  db.events.on ('edited', queueRefresh);
}

async function queueRefresh() {
  if (state !== RefreshState.None) {
    state = RefreshState.Queued;
    return;
  }

  state = RefreshState.Running;
  await refresh ();

  // @ts-expect-error It can be set to queued asynchronously
  // If this was queued during the run, we'll run again
  if (state === RefreshState.Queued) {
    state = RefreshState.None;
    queueRefresh ();
  }
  else {
    state = RefreshState.None;
  }
  return;
}

// fetch all meetups from the DB
// and update the directory channel in chronological order
async function refresh () {
  // todo: add timestmap filter
  const meetups = await db.find ().then (
    models => models.sort ((a, b) => a.timestamp.localeCompare (b.timestamp))
  );

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
        description: `*${meetup.title} was cancelled by the organizer*`,
        color:       '#454545'
      });

    case 'Ended':
      return new MessageEmbed ({
        description: `*${meetup.title} has ended*`,
        color:       '#454545'
      });

    case 'Live': {
      const link = (() : string => {
        switch (meetup.announcement.type) {
          // todo: this is incorrect
          case 'Announcement': return `https://discord.com/channels/530586255197732868/${channels.meetups_directory}/${meetup.announcement.announcementId}`;
          case 'Inline': return `https://discord.com/channels/530586255197732868/${meetup.announcement.channelId}/${meetup.announcement.messageId}`;
          case 'Pending': return '';
        }
      }) ();

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
  }
}

async function post (content: string | MessageEmbed, id?: string) {
  if (id) {
    const message = await Instance.fetchMessage (channels.meetups_directory, id);
    await message.edit (content);
    return id;
  }
  else {
    const channel = await Instance.fetchChannel (channels.meetups_directory);
    const message = await channel.send (content);
    return message.id;
  }
}