import Hapi from '@hapi/hapi';
import * as Discord from 'discord.js';
import { wait } from '@sjbha/utils/wait';

import * as WorkoutEmbed from './WorkoutEmbed';

// Whenever an activity is created/updated/deleted, 
// we get notified via a webhook with this event data
export type event = {
  aspect_type: 'create' | 'update' | 'delete';
  object_type: 'activity' | 'athlete';
  // The ID of what was updated
  object_id: number;
  // Athlete ID
  owner_id: number;
}

const warned = (value: string) : string => {
  console.log (value);
  return value;
}

// When an activity is first posted as 'created',
// We'll give the user some (n) amount of time to edit their activity
// This set just keeps track of which activities are waiting to be posted
const pending = new Set<number> ();

// Adds a small buffer to the first post
const post = async (client: Discord.Client, athleteId: number, activityId: number, delay = 0) => {
  // Skip if we're already awaiting on this activity
  if (pending.has (activityId))
    return;

  pending.add (activityId);
  
  try {
    delay && await wait (delay);
    await WorkoutEmbed.post (client, athleteId, activityId);
  }
  catch (e) {
    const message = (e instanceof Error) ? e.message : '(unknown reasons)';
    console.error (`Failed to post workout (athleteId:${athleteId}|activityId:${activityId}): ${message}`);
  }
  finally {
    pending.delete (activityId); 
  }
}

export const handleEvent = (client: Discord.Client) => async (req: Hapi.Request) : Promise<string> => {
  const params = req.payload as event;
  console.log ('Webhook Request', params);

  if (params.object_type === 'athlete')
    return warned ('Ignore Athlete Update');

  // Do not have a current feature to delete
  // a posted workout, but it's on the TODO list
  if (params.aspect_type === 'delete') 
    return warned ('Delete not currently supported');

  const delay = (params.aspect_type === 'create') ? 60 * 1000 : 0;
  post (client, params.owner_id, params.object_id, delay);

  return 'Done!'
}
