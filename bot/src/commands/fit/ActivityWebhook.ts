import Hapi from "@hapi/hapi";
import * as Discord from "discord.js";
import { logger } from "../../logger";

import * as WorkoutEmbed from "./WorkoutEmbed";

// Whenever an activity is created/updated/deleted, 
// we get notified via a webhook with this event data
export type event = {
  aspect_type: "create" | "update" | "delete";
  object_type: "activity" | "athlete";
  // The ID of what was updated
  object_id: number;
  // Athlete ID
  owner_id: number;
}

const log = logger ("fit:activity-webhook");

/** Simple util that just resolves a promise after a certain amount of milliseconds */
const wait = (ms: number) : Promise<void> => new Promise (resolve => setTimeout (resolve, ms));

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
   catch (error) {
      log.error ("Workout failed to post", error);
   }
   finally {
      pending.delete (activityId); 
   }
};

export const handleEvent = (client: Discord.Client) => async (req: Hapi.Request) : Promise<string> => {
   const params = req.payload as event;
   log.info ("Strava Webhook Request", params);

   if (params.object_type === "athlete") {
      log.debug ("Ignoring athlete update");
      return "";
   }
  
   // Do not have a current feature to delete
   // a posted workout, but it's on the TODO list
   if (params.aspect_type === "delete") {
      log.debug ("No support for DELETE");
      return "";
   }

   const delay = (params.aspect_type === "create") ? 60 * 1000 : 0;
   post (client, params.owner_id, params.object_id, delay);

   return "Done!";
};
