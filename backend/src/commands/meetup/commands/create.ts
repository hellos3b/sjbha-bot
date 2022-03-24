import { Message } from 'discord.js';
import { nanoid } from 'nanoid';
import YAML from 'yaml';
import { DateTime } from 'luxon';
import { Log } from '@sjbha/app';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';
import { render } from '../features/RenderAnnouncement';
import { parse } from '../common/MeetupOptions';


const log = Log.make ('meetup:create');

/**
 * Creates a new meetup
 */
export async function create (message: Message) : Promise<void> {
  const inputText = message.content.replace ('!meetup create', '');
  const mention = `<@${message.author.id}>`;
  log.command (message);

  message.delete ();

  // Guard for guild channels, lets us create threads
  if (message.channel.type !== 'GUILD_TEXT')
    return;

  const messageOptions = (() : unknown | undefined => {
    try { return YAML.parse (inputText); }
    catch (e) { return undefined; }
  }) ();

  if (!messageOptions) {
    log.debug ('Meetup options are malformed');
    message.channel.send (`${mention} - Hm the meetup options are in an invalid format. Make sure you're copy and pasting the whole command correctly.`);
    return;
  }

  const options = parse (messageOptions);
  
  if (options.failed) {
    log.debug ('Unable to parse meetup options', { reason: options.message });
    message.channel.send (`${mention} - Something is wrong with the options in your command. Make sure to copy and paste everything from the UI! (${options.message})`);
    return;
  }

  const thread = await message.channel.threads.create ({
    name:                `🗓️  ${M.threadTitle (options.title, options.date)}`,
    reason:              'Meetup discussion thread',
    autoArchiveDuration: 1440,
  });

  const meetup : db.Meetup = {
    id:              nanoid (),
    organizerID:     message.author.id,
    title:           options.title,
    sourceChannelID: message.channel.id,
    threadID:        thread.id,
    announcementID:  '',
    createdAt:       DateTime.local ().toISO (),
    category:        options.category || 'default',
    timestamp:       DateTime.fromISO (options.date).toISO (),
    description:     options.description || '',
    links:           options.links ?? [],
    rsvps:           [
      message.author.id
    ],
    maybes:   [],
    location: M.location (options),
    state:    { type: 'Live' }
  };

  try {
    const post = await render (message.client, meetup);

    await db.insert ({ 
      ...meetup,
      announcementID: post.id
    });

    await post.pin ();
    await thread.members.add (message.author.id);
  }
  catch (e) {
    log.error ('Failed to create meetup', e);
    await message.channel.send ('⚠️ Bot broke unexpectedly while trying to post meetup');
    await thread.delete ();
  }
}