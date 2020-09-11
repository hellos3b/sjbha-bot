import _ from "lodash";
import {MessageEmbed} from "discord.js";
import fromNow from "fromnow";

import { DiscordMember } from "@services/bastion";

import { UserProfile } from "../../domain/user/User";
import { SummaryDetails } from "../../domain/strava/ActivitySummary";

import ActivityEmoji from "./ActivityEmoji";

interface ProfileData {
  member: DiscordMember, 
  user: UserProfile,
  activities: SummaryDetails  
}

export default function ProfileEmbed({member, user, activities}: ProfileData) {
  const embed = new MessageEmbed().setColor("#4ba7d1");

  embed.setAuthor(member.member.displayName, member.avatar);

  embed.addField("Level", user.level, true);
  embed.addField("EXP", user.exp.toFixed(1), true);

  embed.addField("Fit Score", `${user.fitScore.score} *(${user.fitScore.rankName})*`, true);

  const recent = activities.lastActivity;
  if (recent) {
    const time = fromNow(recent.timestamp.toString(), {suffix: true, max: 1});
    const emoji = new ActivityEmoji(recent.type, user.gender);

    embed.addField("Last Activity", `${emoji.toString()} ${recent.name} • *${time}*`);
  } else {
    embed.addField("Last Activity", "*no activities in last 30 days*");
  }

  const activityField = _(activities.stats)
    .sort((a, b) => a.count > b.count ? -1 : 1)
    .map((summary) => `**${summary.type}** • ${summary.count} activities (${summary.totalTime.toString()})`)
    .join("\n")

  embed.addField(`30 Day Totals *(${activities.count} Activities)*`, activityField);

  return embed;
}