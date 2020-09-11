import bastion from "@services/bastion";
import * as express from "express";
import Debug from "debug";
import {post_to_channel} from "../../config";
import {NotConnected} from "../errors";

import {createActivityEmbed} from "../bot/embeds/ActivityEmbed";

import { getUserByStravaId, saveUser, getUser } from "../domain/user/UserRepository";
import { getActivityByStravaId } from "../domain/strava/ActivityRepository";
import { insertWorkout } from "../domain/exp/WorkoutLogRepository";
import Workout from "../domain/exp/WorkoutLog";

const debug = Debug("c/fit:auth-web");

// We extend request object for authorized requests
interface AuthorizedRequest extends express.Request {
  discordId?: string;
}

/** 
 * When an athlete posts an activity, this webhook is called with the owner ID and activity ID.
 * We need to add it to the profile data, and then send the embed to the channel
 * 
 * @body `owner_id` The athlete ID
 * @body `object_id` The activity ID
 * @body `aspect_type` Whether the event is a "create", or (something else)
 */
export async function postActivity(req: express.Request, res: express.Response) {
  const stravaId = String(req.body["owner_id"]);
  const activityId = String(req.body["object_id"]);
  const eventType = <string>req.body["aspect_type"];

  try {
    const [user, activity] = await Promise.all([
      getUserByStravaId(stravaId),
      getActivityByStravaId(stravaId, activityId)
    ]);

    // Preform update
    const exp = user.addActivity(activity);

    // Save shit
    const workout = Workout.create(user.id, activity.id, exp);
    await Promise.all([
      saveUser(user),
      insertWorkout(workout)
    ]);

    // Now lets send off an embed
    const discordUser = bastion.getMember(user.id);

    // Create embed
    const embed = createActivityEmbed({
      member  : discordUser,
      user    : user.getProfile(), 
      exp     : workout.exp, 
      activity
    })

    // finally lets send the embed
    await bastion.sendTo(post_to_channel, embed);

    res.status(200).send("Posted");
    
  } catch (e) {
    if (e.name === NotConnected.type) {
      debug("Could not post activity: %o", e.message);
      res.status(401).send("Hasn't been authorized ")
    } else {
      console.error(e);
      res.status(500).send("Messed something up")
    }
  }
}


/**
 * Sets the max heart rate for a user. Auth middleware is required
 */
export async function updateMaxHR(req: AuthorizedRequest, res: express.Response) {
  const maxHr = Number(req.body["hr"]);
  const discordId = req.discordId;

  if (!discordId) {
    res.status(401).json({message: `Missing discord ID`});
    return;
  }

  const user = await getUser(discordId);

  user.updateMaxHeatrate(maxHr);
  await saveUser(user);

  res.send({success: true})
}