import type {Request} from "@services/bastion";

import * as R from "ramda";
import * as F from "fluture";

import * as User from "../../models/user";
import * as Activity from "../../models/activity";

import {handleError} from "./errorHandler";
import * as Profile from "./profile-embed";

// 
// Display an over view of stats 
//
export const profile = async (req: Request) => {
  R.pipe(
    fetchProfileData,
    F.map (Profile.embed),
    F.fork (handleError(req)) (req.embed)
  )(req.author.id)
}

/** Combines user data with activities */
const withActivities = (user: User.PublicUser) => R.pipe(
  Activity.getLastMonth,
  F.map<Activity.Model[], Profile.Data> 
    (activities => ({user, activities}))
)(user)

const fetchProfileData = R.pipe(
  User.getAsPublicUser,
  F.chain (withActivities)
)