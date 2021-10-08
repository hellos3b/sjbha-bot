import { Message } from 'discord.js';
import { nanoid } from 'nanoid';
import YAML from 'yaml';

import { mapOptionsToMeetup, ValidationError } from '../common/MeetupOptions';
import Meetup from '../core/Meetup';
import * as db from '../db/meetups';


/**
 * Creates a new meetup
 */
 export async function create (message: Message) : Promise<void> {
  const inputText = message.content.replace ('!meetup create', '');
  const messageOptions = YAML.parse (inputText);

  const options = mapOptionsToMeetup (messageOptions);
  
  if (options instanceof ValidationError) {
    message.reply (options.error);

    return;
  }

  const meetup = db.Meetup ({
    id:           nanoid (),
    details:      db.Details ({ ...options, organizerId: message.author.id }),
    state:        db.MeetupState.Created (),
    announcement: db.AnnouncementType.Pending (message.channel.id)
  });

  await Meetup.post (meetup);
  await message.delete ();
}