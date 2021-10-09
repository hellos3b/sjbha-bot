import { DateTime } from 'luxon';
import { object, string, enums, array, pattern, optional, assert, Infer, StructError } from 'superstruct';

const MAX_DESCRIPTION_SIZE = 1600;

// eslint-disable-next-line max-len
const url = pattern (string (), /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/);
const ISOstring = pattern (string (), /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+/);

export type MeetupOptions = Infer<typeof MeetupOptions>;
const MeetupOptions = object ({
  title:       string (),
  description: optional (string ()),
  date:        ISOstring,

  location:          optional (string ()),
  location_type:     optional (enums (['address', 'private', 'voice'])),
  location_comments: optional (string ()),

  links: optional (array (
    object ({
      name: optional (string ()),
      url:  url
    })
  ))
});


export function validateOptions (opt: unknown) : MeetupOptions | ValidationError {
  if (!opt) {
    // todo fix error response
    return new ValidationError ('Go to the meetup creator to enter some options');
  }

  try { assert (opt, MeetupOptions); }
  catch (e) {
    return (e instanceof StructError) 
      ? new ValidationError (e.message)
      : new ValidationError ('Could not parse your errors');
  }

  const date = DateTime.fromISO (opt.date);

  if (date.toMillis () <= DateTime.utc ().toMillis ())
    return new ValidationError ('Cant create a meetup that is set to the past');
    
  if (opt.description && opt.description.length > MAX_DESCRIPTION_SIZE)
    return new ValidationError ('Description is too long');

  if (opt.location_type) {
    if (!opt.location)
      return new ValidationError ('Location is missing');

    if (opt.location_comments && opt.location_comments.length > 300)
      return new ValidationError ('Location comments can only be 300 characters long');
  }

  return opt;
}


export class ValidationError {
  constructor (public readonly error: string) {}
}