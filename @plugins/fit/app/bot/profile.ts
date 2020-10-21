import type {Request} from "@services/bastion";
import type {MessageOptions} from "discord.js";

import * as R from "ramda";
import * as F from "fluture";

import * as User from "../../models/user";
import * as Activity from "../../models/activity";

import {handleError} from "./errorHandler";
import * as Profile from "./profile-embed";

type Embed = MessageOptions["embed"];

// 
// Display an over view of stats 
//
export const profile = async (req: Request) => {
  const reply = (embed: Embed) => req.reply({embed});

  R.pipe(
    fetchProfileData,
    F.map (Profile.embed),
    F.fork (handleError(req)) 
          (reply)
  )(req.author.id)
}

const withActivities = (user: User.PublicUser) => R.pipe(
  () => Activity.getLastMonth(user),
  F.map<Activity.Model[], Profile.Data>(
    activities => ({user, activities})
  )
)()

const fetchProfileData = R.pipe(
  User.getAsPublicUser,
  F.chain (withActivities)
)