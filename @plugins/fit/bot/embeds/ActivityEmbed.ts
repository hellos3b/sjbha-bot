import type { MessageOptions } from "discord.js";
import type { DiscordMember } from "@services/bastion";
import type ExperiencePoints from "../../domain/user/ExperiencePoints";
import type Activity from "../../domain/strava/Activity";
import type { UserProfile } from "../../domain/user/User";

import {map, reject, applyTo, pipe, prepend, defaultTo, includes, join} from "ramda";
import format from 'string-format';
import {prop, propOr, switchcase, filterNil} from "../../fp-utils";
import {toMiles, toTime, toPace, toTenths} from "./conversions";
import {ActivityType} from "../../config";

import {Field, asField} from "./embed";
import {getEmoji} from "./emoji";
import { ActivityResponse } from "@plugins/fit/strava-client";

// todo: make move this interface to some kind of mapping FN
interface CreateProps {
  member: DiscordMember;
  user: UserProfile;
  exp: ExperiencePoints;
  activity: Activity;
  weeklyExp: number;
}

export const createActivityEmbed = ({member, user, exp, activity, weeklyExp}: CreateProps): MessageOptions["embed"] => ({
  title       : activity.name,
  description : activity.description || "",
  color       : 0xFC4C02,
  thumbnail   : { 
    url: member.avatar 
  },
  author: { 
    name: heading(
      member.member.displayName, 
      user.gender, 
      activity.type
    ) 
  },
  fields: statFields(
    activity.getRaw(), 
    user.optedOutHR || !activity.hasHeartrate
  ),
  footer: { 
    text: footerText(exp, weeklyExp)
  }
})

const heading = (gender: string, displayName: string, activityType: string) => 
  format('{1} {2} {3}', [
    getEmoji(gender)(activityType), 
    displayName,
    getVerb(activityType)
  ])

/** For the fields we pick specific stats per activity, and then format it */
const statFields = (activity: ActivityResponse, showHeartrate: boolean) => pipe(
  activityFields,
  map(applyTo(activity)),
  filterHRIf(showHeartrate),
  filterNil
)(activity.type);

/** The slightly muted text at the bottom of the embed. Lets show experience pt progress */
const footerText = (exp: ExperiencePoints, weeklyExp: number) => 
  format('Gained {1} exp ({2}+ {3}++) | {4} exp this week', [
    toTenths(exp.total),
    toTenths(exp.moderate),
    toTenths(exp.vigorous),
    toTenths(weeklyExp)
  ]);

// Conversions for all the fields
const time = pipe(
  prop("elapsed_time"),
  toTime, 
  asField("Time")
);

const pace = pipe(
  prop("speed"),
  toPace, 
  asField("Pace")
);

const distance = pipe(
  prop("distance"),
  toMiles, 
  asField("Distance")
);

const averageHeartrate = pipe(
  propOr<number>("average_heartrate", 0),
  Math.round,
  asField("Avg HR")
);

const maxHeartrate = pipe(
  propOr<number>("max_heartrate", 0),
  Math.round,
  asField("Max HR")
);

const elevation = pipe(
  prop("total_elevation_gained"),
  toMiles, 
  asField("Elevation")
);

/** Get the fields for the specific type of activity */
const activityFields = (activityType: string) => pipe(
  switchcase({
    [ActivityType.RIDE] : [distance, elevation],
    [ActivityType.RUN]  : [distance, pace],
    [ActivityType.HIKE] : [distance, elevation],
    [ActivityType.WALK] : [distance],
    [ActivityType.YOGA] : []
  }),
  defaultTo([averageHeartrate, maxHeartrate]),
  prepend(time)
)(activityType);

/** The action that the user just did, in english */
const getVerb = (activityType: string) => pipe(
  switchcase({
    [ActivityType.RIDE]   : "just went for a ride",
    [ActivityType.RUN]    : "just went for a run",
    [ActivityType.YOGA]   : "just did some yoga",
    [ActivityType.CROSSFIT]: "just did crossfit",
    [ActivityType.WEIGHT_TRAIN]: "just lifted some weights",
    [ActivityType.HIKE]   : "just went on a hike",
    [ActivityType.WALK]   : "just went on a walk",
    [ActivityType.ROCK_CLIMB]: "just went rock climbing"
  }),
  defaultTo("just did a workout")
)(activityType)

/** If user has Opted out of HR, we filter out the HR related fields */
const filterHRIf = (filterHR: boolean) => reject(
  (field: Field) => filterHR && includes(field.name, "HR")
);