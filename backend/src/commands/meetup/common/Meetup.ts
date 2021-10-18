import { DateTime } from 'luxon';
import * as db from '../db/meetups';
import { MeetupOptions } from './validateOptions';


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


/**
 * Format the title that is used for the meetup thread
 * @param meetup 
 * @returns 
 */
export function threadTitle (title: string, timestamp: string) : string {
  const dateShort = DateTime.fromISO (timestamp).toFormat ('MMM dd');
  return `${dateShort} - ${title}`;
}