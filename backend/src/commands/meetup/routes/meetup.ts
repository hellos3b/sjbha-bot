import Boom from '@hapi/boom';
import Hapi from '@hapi/hapi';

import * as db from '../db/meetups';
import { pick } from '@sjbha/utils/object';

export const meetup = async (req: Hapi.Request) : Promise<unknown> => {
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
    'category',
    'links',
    'location'
  );
}