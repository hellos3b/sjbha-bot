import {map, isEmpty, always, pipe, join, ifElse, sort} from "ramda";
import {MessageOptions} from "discord.js";
import fromNow from "fromnow";

import { DiscordMember } from "@services/bastion";

import { UserProfile } from "../../domain/user/User";
import { SummaryDetails, SummaryStats } from "../../domain/strava/ActivitySummary";
import {toTenths} from "./conversions";
import {getEmoji} from "./emoji";
import { asField } from "./embed";
import Activity from "@plugins/fit/domain/strava/Activity";

interface ProfileData {
  member: DiscordMember, 
  user: UserProfile,
  activities: SummaryDetails  
}

export const createProfileEmbed = ({member, user, activities}: ProfileData): MessageOptions["embed"] => ({
  color: 0x4ba7d1,
  author: {
    name: member.member.displayName,
    icon_url: member.avatar
  },

  fields: [
    pipe(
      always(user.level),
      asField("Level")
    )(),

    pipe(
      always(user.exp),
      toTenths, 
      asField("EXP")
    )(),

    pipe(
      always(user.fitScore),
      ({score, rankName}) => `${score} *(${rankName})*`,
      asField("Fit Score")
    )(),

    pipe(
      () => lastActivity(user, activities),
      asField("Last Activity", false)
    )(),

    pipe(
      totalsPerActivity,
      asField(`30 Day Toals *(${activities.count} Activities)*`)
    )(activities)
  ]
})

/** Show the last activity's title, otherwise let user know it's empty */
const lastActivity = (user: UserProfile, activities: SummaryDetails): string => ifElse(
  isEmpty,
  () => "*No activities in last 30 days*",
  (activity: Activity) => join(" ", [
    getEmoji(user.gender)(activity.type),
    activity.name,
    fromNow(activity.timestamp.toString(), {suffix: true, max: 1}),
  ])
)(activities.lastActivity)

/** Display totals of each workout type, along with count + time */
const totalsPerActivity = (activities: SummaryDetails) => pipe(
  sort<SummaryStats>((a, b) => a.count > b.count ? -1 : 1),
  map(summary => `**${summary.type}** • ${summary.count} activities (${summary.totalTime.toString()})`),
  join("\n")
)(activities.stats)