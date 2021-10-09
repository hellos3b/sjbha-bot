import { Message } from 'discord.js';
import { nanoid } from 'nanoid';
import YAML from 'yaml';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';
import { validateOptions, ValidationError } from '../common/validateOptions';
import { Announcement } from '../embeds/Announcement';


/**
 * Creates a new meetup
 */
 export async function create (message: Message) : Promise<void> {
  const inputText = message.content.replace ('!meetup create', '');
  const messageOptions = YAML.parse (inputText);

  const options = validateOptions (messageOptions);
  
  if (options instanceof ValidationError) {
    message.reply (options.error);

    return;
  }

  const meetup : db.Meetup = {
    id:           nanoid (),
    organizerId:  message.author.id,
    title:        options.title,
    // todo: verify date format 
    timestamp:    options.date,
    description:  options.description || '',
    links:        options.links ?? [],
    location:     M.location (options),
    state:        { type: 'Live' },
    announcement: { type: 'Pending', channelId: message.channel.id }
  };

  const [announcement] = await Promise.all ([
    message.channel.send (Announcement (meetup, [])),
    message.delete ()
  ]);
  
  await db.insert ({
    ...meetup,
    announcement: { 
      type:      'Inline', 
      channelId: announcement.channel.id,
      messageId: announcement.id
    }
  });
}