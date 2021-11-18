import { Route } from '@sjbha/app';
import { wait } from '@sjbha/utils/wait';
import { postWorkout } from '../features/post-workout';

// When an activity is first posted as 'created',
// We'll give the user some (n) amount of time to edit their activity
// This set just keeps track of which activities are waiting to post
const pending = new Set<number> ();

/**
 * After a user accepts on Strava's integrations hook, it will redirect us with an access code and the state we passed (auth token)
 * This route will verify the auth, and then initialize the user's account with defaults
 */
export const newWorkout : Route = async req => {
  const params = req.payload as Webhook;

  console.log ('Webhook Request', params);

  // Webhook gets updates to users profile,
  // We can ignore these
  if (params.object_type === 'athlete') {
    console.warn ('Ignore Athlete Update');

    return 'Ignoring Athlete Update';
  }


  // Do not have a current feature to delete
  // a posted workout, but it's on the TODO list
  if (params.aspect_type === 'delete') {
    console.warn ('Delete not currently supported');

    return 'Delete not currently supported';
  }


  // If this activity is already waiting to be posted
  // we can just ignore the event
  if (pending.has (params.object_id)) {
    console.warn ('Activity is pending, skip');

    return 'Activity is already pending, ignoring';
  }


  // New workouts have a minor delay before being submitted
  if (params.aspect_type === 'create') {
    postWithDelay (params.owner_id, params.object_id);
  }
  else {
    postWorkout (params.owner_id, params.object_id);
  }

  return 'Done!'
}


// Adds a small buffer to the first post
const postWithDelay = async (athleteId: number, activityId: number) => {
  pending.add (activityId);

  // Wait a minute before posting
  await wait (60 * 1000);
  
  try {
    await postWorkout (athleteId, activityId);
  }
  catch (e) {
    if (e instanceof Error) {
      console.error (`Failed to post workout (athleteId:${athleteId}|activityId:${activityId}) ${e.message}`);
    }
    else {
      console.error (`Failed to post workout ${athleteId}/${activityId} for unknown reasons`, e);
    }
  }

  pending.delete (activityId);
}


/** The JSON Data that is sent as part of the incoming webhook */
export type Webhook = {

  /** Always either 'activity' or 'athlete' */
  object_type: 'activity' | 'athlete';
  
  /** The unique ID for either the activity or athlete */
  object_id: number;

  /** The type of action that triggered this event */
  aspect_type: 'create' | 'update' | 'delete';

  /** The ID of the athlete */
  owner_id: number;
}