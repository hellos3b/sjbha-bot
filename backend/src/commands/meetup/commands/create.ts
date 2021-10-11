import { Message } from 'discord.js';
import { nanoid } from 'nanoid';
import YAML from 'yaml';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';
import { validateOptions, ValidationError } from '../common/validateOptions';
import { Announcement } from '../common/Announcement';
import { DateTime } from 'luxon';


/**
 * Creates a new meetup
 */
export async function create (message: Message) : Promise<void> {
  // Guard for guild channels, lets us create threads
  if (message.channel.type !== 'GUILD_TEXT')
    return;

  const inputText = message.content.replace ('!meetup create', '');
  const messageOptions = (() : unknown | undefined => {
    try { return YAML.parse (inputText); }
    catch (e) { return undefined; }
  }) ();

  if (!messageOptions) {
    message.reply ('Hm couldn\'t understand the options -- Make sure you\'re copy and pasting the whole command correctly.');
    return;
  }

  const options = validateOptions (messageOptions);
  
  if (options instanceof ValidationError) {
    message.reply (options.error);
    return;
  }

  const meetup : db.Meetup = {
    id:              nanoid (),
    organizerID:     message.author.id,
    title:           options.title,
    sourceChannelID: message.channel.id,
    createdAt:       DateTime.local ().toISO (),
    // todo: verify date format 
    timestamp:       options.date,
    description:     options.description || '',
    links:           options.links ?? [],
    location:        M.location (options),
    state:           { type: 'Live' },
    announcement:    { type: 'Pending', channelId: message.channel.id }
  };

  const [announcement] = await Promise.all ([
    message.channel.send ({ embeds: [Announcement (meetup, [])] }),
    message.delete ()
  ]);

  const thread = await announcement.startThread ({
    name:   `📅 ${meetup.title}`,
    reason: 'Needed a separate thread for food',
    
    autoArchiveDuration: 60,
  });

  await thread.send ('This thread was automatically created for meetup discussion. Ask questions, make plans, and find people in this thread');
  
  await db.insert ({
    ...meetup,
    threadID:     thread.id,
    announcement: { 
      type:      'Inline', 
      channelId: announcement.channel.id,
      messageId: announcement.id
    }
  });
}