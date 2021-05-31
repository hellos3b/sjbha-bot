import { Route } from '@sjbha/app';
import { Codec, exactly, number, parseError } from 'purify-ts';
import Boom from '@hapi/boom';

import { postWorkout } from '../features/activity-post';

const NewActivityQuery = Codec.interface ({
  owner_id:    number,
  object_id:   number,
  aspect_type: exactly ('create') // note: if we want to expand to catching updates, we have to change this
});

/**
 * After a user accepts on Strava's integrations hook, it will redirect us with an access code and the state we passed (auth token)
 * This route will verify the auth, and then initialize the user's account with defaults
 */
export const newWorkout : Route = async req => {
  // Validate request query
  const params = NewActivityQuery
    .decode ({ ...req.query })
    .mapLeft (val => {
      const error = parseError (val);
      throw Boom.badRequest ('Failed to decode query', error);
    })
    .unsafeCoerce ();

  postWorkout (params.owner_id, params.object_id);

  return 'Done';
}