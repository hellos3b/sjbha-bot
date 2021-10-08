import { DateTime } from 'luxon';

import { object, string, enums, array, pattern, optional, assert } from 'superstruct';
import { Location, Details } from '../db/meetups';

const MAX_DESCRIPTION_SIZE = 1600;

// eslint-disable-next-line max-len
const url = pattern (string (), /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/);

const ISOstring = pattern (string (), /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+/);

const link = object ({
  name: optional (string ()),
  url:  url
});

const options = object ({
  title:       string (),
  description: optional (string ()),
  date:        ISOstring,

  location:          optional (string ()),
  location_type:     optional (enums (['address', 'private', 'voice'])),
  location_comments: optional (string ()),

  links: optional (array (link))
});

type UserMeetupOptions = Omit<Details, 'organizerId'>;

export function mapOptionsToMeetup (opt: unknown) : UserMeetupOptions | ValidationError {
  try { assert (opt, options); }
  catch (e) {
    console.error ('FAIL', e);

    // todo:
    return new ValidationError ('todo: MessageOptions failed to parse, need to include the error message');
  }

  const date = DateTime.fromISO (opt.date);

  if (date.toMillis () <= DateTime.utc ().toMillis ())
    return new ValidationError ('Cant create a meetup that is set to the past');
    
  if (opt.description && opt.description.length > MAX_DESCRIPTION_SIZE)
    return new ValidationError ('Description is too long');

  const meetup : UserMeetupOptions = {
    title:       opt.title,
    description: opt.description || '',
    timestamp:   date,
    links:       opt.links || [],
    location:    Location.None ()
  };


  if (opt.location_type) {
    if (!opt.location)
      return new ValidationError ('Location is missing');

    if (opt.location_comments && opt.location_comments.length > 300)
      return new ValidationError ('Location comments can only be 300 characters long');

    meetup.location = 
      (opt.location_type === 'voice')     ? Location.Voice ()
      : (opt.location_type === 'private') ? Location.Private (opt.location, opt.location_comments)
      : Location.Address (opt.location, opt.location_comments);
  }

  return meetup;
}

export class ValidationError {
  constructor (public readonly error: string) {}
}