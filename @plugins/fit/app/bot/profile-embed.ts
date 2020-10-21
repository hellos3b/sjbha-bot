import { asField, Embed } from "@services/bastion/fp";

import * as R from "ramda";
import * as FP from "../../utils/fp-utils";
import * as User from "../../models/user";
import * as Activity from "../../models/activity";

import format from 'string-format';

import {toRelative, toTime} from "./conversions";
import { Maybe } from "purify-ts";

export interface Data {
  user: User.PublicUser,
  activities: Activity.Model[]
}

export const embed = ({user, activities}: Data): Embed => ({
  color: 0x4ba7d1,

  author: {
    name    : user.displayName,
    icon_url: user.avatar
  },

  fields: [
    R.compose 
      (asField("Level"), User.level) 
      (user.xp),

    R.compose 
      (asField("EXP"), shortenNum) 
      (user.xp),

    R.compose
      (asField("Fit Score"), formatScore)
      (user.fitScore),

    R.compose
      (asField("Last Activity", false), recent)
      (Activity.mostRecent (activities)),

    R.compose
      (asField(`30 Day Totals *(${activities.length} Activities)*`), totals)
      (activities)
  ]
});

const formatSummary = (summary: Activity.Summary) => format(
  '**{0}** • {1} activities ({2})',
    summary.type,
    String(summary.count),
    toTime(summary.totalTime)
  )
  
const formatScore = (score: number) => format(
  '{0} *({1})*',
  R.pipe(Math.floor, String)(score),
  User.rankName(score)
)

const formatRecentActivity = (activity: Activity.Model) => format(
  '{0} {1} *{2}*',
    " ",
    // emoji(activity.type),
    activity.name,
    R.pipe(Activity.started, toRelative)(activity)
  )


/** Summarizes individual activity types */
const summarizeTypes = R.pipe(
  Activity.groupByType,
  R.mapObjIndexed (Activity.summary),
  Object.values
);

/** Display totals of each workout type, along with count + time */
const totals = R.pipe(
  summarizeTypes,
  FP.sortByProp ("count", 1),
  R.map (formatSummary),
  R.join ("\n")
)

/** If a number is over 1,000, shorten it to "1k" format */
const shortenNum = (num: number) => {
  if (num >= 1000) return Math.floor(num / 100)/10 + "k";
  return Math.floor(num);
}

const recent = (activity: Maybe<Activity.Model>) => 
  activity
    .map(formatRecentActivity)
    .orDefault("*No activities in last 30 days*")