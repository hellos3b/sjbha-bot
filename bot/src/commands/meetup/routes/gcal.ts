import Boom from '@hapi/boom';
import Hapi from '@hapi/hapi';
import { DateTime } from 'luxon';
import { option } from 'ts-option';

import * as db from '../db/meetups';

export const redirectGoogleCalendar: Hapi.Lifecycle.Method = async (req, reply) => {
  const id = req.params.id;

  if (!id)
    return Boom.badRequest ('Missing property \'id\'');

  const meetup = await db.findOne ({ id });

  if (!meetup)
    return Boom.notFound (`Could not find meetup with id '${id}''`);

  const encodeDate = (timestamp: DateTime) =>
    timestamp.toISO ().replace (/(-|:|\.)/g, '');

  const ts = DateTime.fromISO (meetup.timestamp);

  const options = {
    action:   'TEMPLATE',
    text:     meetup.title,
    dates:    encodeDate (ts) + '/' + encodeDate (ts.plus ({ hour: 2 })),
    details:  meetup.description,
    location: option (meetup.location)
      .filter (loc => loc.autoLink)
      .map (loc => loc.value)
      .getOrElseValue (''),
    trp: true
  }

  const query = Object.entries (options)
    .map (([key, value]) => `${key}=${encodeURIComponent (value)}`)
    .join ('&');

  const url = `https://calendar.google.com/calendar/render?${query}`;

  return reply.redirect (url);
}