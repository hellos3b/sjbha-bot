import { Route } from '@sjbha/app';
import { findOne } from '../db/meetups';

export const meetup : Route = async req => {
  const id = req.params.id;

  if (!id)
    return 'No meetup found';

  const meetup = await findOne ({ id }); 

  if (!meetup)
    return 'Nope';

  return meetup;
}