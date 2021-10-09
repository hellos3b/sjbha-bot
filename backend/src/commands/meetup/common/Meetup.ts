import { Instance } from '@sjbha/app';
import { Message, MessageEmbed } from 'discord.js';
import * as db from '../db/meetups';
import { MeetupOptions } from './validateOptions';

/**
 * Edits the announcement message
 * @param meetup  The meetup to edit
 * @param embed   The new embed
 * @returns A reference to the message that has been edited
 */
export function edit (meetup: db.Meetup, embed: MessageEmbed) : Promise<Message> {
  switch (meetup.announcement.type) {
    case 'Inline':
      return Instance
        .fetchMessage (meetup.announcement.channelId, meetup.announcement.messageId)
        .then (post => post.edit (embed));

    case 'Announcement':
      throw new Error ('Not yet implemented');

    case 'Pending':
      throw new Error ('Cant edit a meetup that hasnt been posted');
  }
}

/**
 * Used in create & edit, this just formats
 * @param type 
 * @returns 
 */
export function location (options: MeetupOptions) : db.Meetup['location'] {
  switch (options.location_type) {
    case 'address': 
      return { type: 'Address', value: options.location || '', comments: options.location_comments || '' };
    
    case 'private':
      return { type: 'Private', value: options.location || '', comments: options.location_comments || '' };

    case 'voice':
      return { type: 'Voice' };

    default:
      return { type: 'None' };
  }
}