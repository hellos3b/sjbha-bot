import { DateTime } from 'luxon';
import { object, string, array, pattern, optional, assert, Infer, StructError, type, boolean } from 'superstruct';
import { option } from 'ts-option';
import * as db from '../db/meetups';

const MAX_DESCRIPTION_SIZE = 1000;

// eslint-disable-next-line max-len
const url = pattern (string (), /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/);
const ISOstring = pattern (string (), /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+/);

export type MeetupOptions = Infer<typeof MeetupOptions>;
const MeetupOptions = type ({
  title:       string (),
  description: optional (string ()),
  date:        ISOstring,

  location:          optional (string ()),
  location_comments: optional (string ()),
  location_linked:   optional (boolean ()),

  category: optional (string ()),
  links:    optional (array (
    object ({
      label: optional (string ()),
      url:   url
    })
  ))
});

type ParseResult =
  | { failed: false } & MeetupOptions
  | { failed: true, message: string }

const Failed = (message: string) : ParseResult =>
  ({ failed: true, message });

export function parse (opt: unknown) : ParseResult {
  if (!opt) {
    // todo fix error response
    return Failed ('Go to the meetup creator to enter some options');
  }

  try { assert (opt, MeetupOptions); }
  catch (e) {
    return (e instanceof StructError) 
      ? Failed (e.message)
      : Failed ('Could not parse your errors');
  }

  const date = DateTime.fromISO (opt.date);

  if (date.toMillis () <= DateTime.utc ().toMillis ())
    return Failed ('Cant create a meetup that is set to the past');
    
  if (opt.description && opt.description.length > MAX_DESCRIPTION_SIZE)
    return Failed ('Description is too long');

  if (opt.location_comments && opt.location_comments.length > 300)
    return Failed ('Location comments can only be 300 characters long');

  return { failed: false, ...opt };
}

/**
 * Used in create & edit, this just formats
 */
 export const toLocation = (options: MeetupOptions) : db.Meetup['location'] => {
  if (options.location) {
    return {
      value:    options.location,
      comments: options.location_comments || '',
      autoLink: option (options.location_linked)
        .getOrElseValue (true) 
    };
  }
  else {
    return undefined;
  }
}
