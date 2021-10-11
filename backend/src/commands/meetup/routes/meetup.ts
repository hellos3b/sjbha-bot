import Boom from '@hapi/boom';
import { Route } from '@sjbha/app';

import * as db from '../db/meetups';
import { pick } from '@sjbha/utils/object';

export const meetup : Route = async req => {
  const id = req.params.id;

  if (!id)
    return Boom.badRequest ('Missing property \'id\'');

  const meetup = await db.findOne ({ id }); 

  if (!meetup)
    return Boom.notFound (`Could not find meetup with id '${id}''`);

  // Omit these properties
  return pick (meetup, 
    'id',
    'title',
    'timestamp',
    'description',
    'links',
    'location'
  );
}