import type { DiscordMember } from "@services/bastion";
import type { UserProfile } from "../../domain/user/User";
import type {FitScoreDetails} from "@plugins/fit/domain/user/FitScore";
import type { SummaryDetails, SummaryStats } from "../../domain/strava/ActivitySummary";
import type Activity from "../../domain/strava/Activity";

import {map, isEmpty, always, pipe, join, ifElse, sort, applyTo} from "ramda";
import format from 'string-format';
import {MessageOptions} from "discord.js";

import {toTenths, toRelative} from "./conversions";
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

const fitScore = ({user}: ProfileData) => pipe(
  () => format('{1} *({2})*', [
    user.fitScore.score, 
    user.fitScore.rankName
  ]),
  asField("Fit Score")
)();

/** Show the last activity's title, otherwise let user know it's empty */
const lastActivity = ({user, activities}: ProfileData) => pipe(
  ifElse(
    isEmpty,
    always("*No activities in last 30 days*"),
    lastActivityOverview(user.gender)
  ),
  asField(`Last Activity`, false)
)(activities.lastActivity)

const lastActivityOverview = (gender: string) => (activity: Activity) => 
  format('{1} {2} {3}', [
    getEmoji(gender)(activity.type),
    activity.name,
    toRelative(activity.timestamp)
  ])

/** Display totals of each workout type, along with count + time */
const activityTotals = ({activities}: ProfileData) => pipe(
  sort<SummaryStats>((a, b) => a.count > b.count ? -1 : 1),
  map(activityTotalSummary),
  join("\n"),
  asField(`30 Day Totals *(${activities.count} Activities)*`)
)(activities.stats)

const activityTotalSummary = (summary: SummaryStats) => 
  format('**{1}** • {2} activities ({3})', [
    summary.type,
    summary.count,
    summary.totalTime.toString()
  ])