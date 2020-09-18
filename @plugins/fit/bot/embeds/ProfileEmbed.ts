import type { DiscordMember } from "@services/bastion";
import type { UserProfile } from "../../domain/user/User";
import type { SummaryDetails, SummaryStats } from "../../domain/strava/ActivitySummary";
import type Activity from "../../domain/strava/Activity";

import {map, isEmpty, always, pipe, join, ifElse, sort, applyTo} from "ramda";
import {MessageOptions} from "discord.js";
import fromNow from "fromnow";

import {toTenths} from "./conversions";
import {getEmoji} from "./emoji";
import { asField, field } from "./embed";

interface ProfileData {
  member: DiscordMember, 
  user: UserProfile,
  activities: SummaryDetails  
}

export const createProfileEmbed = (data: ProfileData): MessageOptions["embed"] => ({
  color: 0x4ba7d1,
  author: {
    name: data.member.member.displayName,
    icon_url: data.member.avatar
  },

  fields: map(
    applyTo(data), 
    [level, exp, fitScore, lastActivity, activityTotals]
  )
})

const level = ({user}: ProfileData) => field("Level", user.level);

const exp = ({user}: ProfileData) => field("EXP", toTenths(user.exp));

const fitScore = ({user}: ProfileData) => field(
  "Fit Score",
  `${user.fitScore.score} *(${user.fitScore.rankName})*`
);

/** Show the last activity's title, otherwise let user know it's empty */
const lastActivity = ({user, activities}: ProfileData) => pipe(
  ifElse(
    isEmpty,
    always("*No activities in last 30 days*"),
    (activity: Activity) => lastActivityOverview(user, activity)
  ),
  asField(`Last Activity`)
)(activities.lastActivity)

const lastActivityOverview = (user: UserProfile, activity: Activity) => join(" ", [
  getEmoji(user.gender)(activity.type),
  activity.name,
  fromNow(activity.timestamp.toString(), {suffix: true, max: 1}),
])

/** Display totals of each workout type, along with count + time */
const activityTotals = ({activities}: ProfileData) => pipe(
  sort<SummaryStats>((a, b) => a.count > b.count ? -1 : 1),
  map(summary => `**${summary.type}** • ${summary.count} activities (${summary.totalTime.toString()})`),
  join("\n"),
  asField(`30 Day Totals *(${activities.count} Activities)*`)
)(activities.stats)