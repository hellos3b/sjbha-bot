import { MessageEmbed } from "discord.js";
import { DiscordMember } from "@services/bastion";

import ActivityEmoji from "./ActivityEmoji";

import ExperiencePoints from "../../domain/user/ExperiencePoints";
import Activity from "../../domain/strava/Activity";
import { UserProfile } from "../../domain/user/User";
import {ActivityType} from "../../config";

interface CreateProps {
  member: DiscordMember;
  user: UserProfile;
  exp: ExperiencePoints;
  activity: Activity;
  weeklyExp: number;
}

export function createActivityEmbed({member, user, exp, activity, weeklyExp}: CreateProps) {
  const nickname = member.member.displayName;
  let embed = new MessageEmbed().setColor("FC4C02");
  
  embed.setTitle(activity.name);
  embed.setDescription(activity.description || "");

  embed.setThumbnail(member.avatar);
  embed.setFooter(`Gained ${exp.total.toFixed(1)} exp (${exp.moderate.toFixed(1)}+ ${exp.vigorous.toFixed(1)}++) | ${weeklyExp.toFixed(1)} exp this week`);
  embed.addField("Time", activity.elapsedTime.hhmmss, true);

  const emoji = new ActivityEmoji(activity.type, user.gender);

  function addHeartrate() {
    // Check if user is opt-out
    if (user.optedOutHR) return;

    // Check if activity has HR data
    if (!activity.hasHeartrate) return;

    embed.addField("Avg HR", Math.round(activity.avgHeartrate), true);
    embed.addField("Max HR", Math.round(activity.maxHeartrate), true);    
  }

  // Fill out activity-specific fields
  switch (activity.type) {

  case ActivityType.RIDE: {
    embed.setAuthor(`${emoji.toString()} ${nickname} just went for a ride`);
    embed.addField("Distance", activity.distance.toMiles.toFixed(2) + "mi", true);
    embed.addField("Elevation", Math.floor(activity.elevation.toFeet) + "ft", true);

    break;
  }

  case ActivityType.RUN: {
    embed.setAuthor(`${emoji.toString()} ${nickname} just went for a run`);
    embed.addField("Distance", activity.distance.toMiles.toFixed(2) + "mi", true);
    embed.addField("Pace", activity.speed.toPace.hhmmss + "m/mi", true);

    break;
  }

  case ActivityType.YOGA: {
    embed.setAuthor(`${emoji.toString()} ${nickname} just did some yoga`);
    break;
  }

  case ActivityType.CROSSFIT: {
    embed.setAuthor(`${emoji.toString()} ${nickname} just did crossfit`);
    addHeartrate();

    break;
  }

  case ActivityType.WEIGHT_TRAIN: {
    embed.setAuthor(`${emoji.toString()} ${nickname} just lifted some weights`);
    addHeartrate();

    break;
  }

  case ActivityType.HIKE: {
    embed.setAuthor(`${emoji.toString()} ${nickname} just did a hike`);
    embed.addField("Distance", activity.distance.toMiles.toFixed(2) + "mi", true);
    embed.addField("Elevation", Math.floor(activity.elevation.toFeet) + "ft", true);

    break;
  }

  case ActivityType.WALK: {
    embed.setAuthor(`${emoji.toString()} ${nickname} just went for a walk`);
    embed.addField("Distance", activity.distance.toMiles.toFixed(2) + "mi", true);

    break;
  }

  default: {
    embed.setAuthor(`${emoji.toString()} ${nickname} just did a workout`);
    addHeartrate(); 

    break;
  }

  }

  return embed;
}