import type { DiscordMember } from "@services/bastion";
import type { Embed, Field } from "@services/bastion/fp";
import type ExperiencePoints from "../../domain/user/ExperiencePoints";
import type { UserProfile } from "../../domain/user/User";
import type Activity from "../../domain/strava/Activity";

import {map, reject, applyTo, pipe, prepend, join, defaultTo, includes, prop} from "ramda";
import format from 'string-format';
import {propOr, switchcase, filterNil} from "../../utils/fp-utils";
import {toMiles, toTime, toPace, toTenths, toFeet} from "../../utils/units";
import {ActivityType} from "../../config";

import { asField } from "@services/bastion/fp";
import { ActivityResponse } from "@plugins/fit/strava-client";
import * as ActivityModel from "../../models/activity";

// todo: make move this interface to some kind of mapping FN
interface CreateProps {
  member: DiscordMember;
  user: UserProfile;
  exp: ExperiencePoints;
  activity: Activity;
  weeklyExp: number;
}

/** If user has Opted out of HR, we filter out the HR related fields */
const filterHRIf = (filterHR: boolean) => reject((field: Field) => filterHR && includes(field.name, "HR"));

/** Typecast `prop` to ActivityResponse */
const activityProp = <K extends keyof ActivityResponse>(key: K) => (obj: ActivityResponse) => prop(key, obj);


const heading = (emoji: string, displayName: string, activityType: string) => format(
  '{0} {1} just {2}',
    emoji, 
    displayName,
    activityVerb(activityType)
  )

/** For the fields we pick specific stats per activity, and then format it */
const statFields = (activity: ActivityResponse, showHeartrate: boolean) => pipe(
  activityFields,
  map(applyTo(activity)),
  filterHRIf(showHeartrate),
  filterNil
)(activity.type);

/** The slightly muted text at the bottom of the embed. Lets show experience pt progress */
const footerText = (exp: ExperiencePoints, weeklyExp: number, hasHR: boolean) => join(" ", [
  format('Gained {0} exp', toTenths(exp.total)),
  hasHR ? format('({0}+ {1}++)', toTenths(exp.moderate), toTenths(exp.vigorous)) : '',
  format('| {0} exp this week', toTenths(weeklyExp))
]);

// Conversions for all the fields
const time = pipe(
  activityProp("elapsed_time"),
  toTime, 
  asField("Time")
);

const pace = pipe(
  activityProp("average_speed"),
  toPace, 
  asField("Pace")
);

const distance = pipe(
  activityProp("distance"),
  toMiles, 
  asField("Distance")
);

const averageHeartrate = pipe(
  activityProp("average_heartrate"),
  defaultTo(0),
  Math.round,
  asField("Avg HR")
);

const maxHeartrate = pipe(
  activityProp("max_heartrate"),
  defaultTo(0),
  Math.round,
  asField("Max HR")
);

const elevation = pipe(
  activityProp("total_elevation_gain"),
  toFeet, 
  asField("Elevation")
);

/** Get the fields for the specific type of activity */
const activityFields = (activityType: string) => pipe(
  switchcase({
    [ActivityType.RIDE] : [distance, elevation],
    [ActivityType.RUN]  : [distance, pace],
    [ActivityType.HIKE] : [distance, elevation],
    [ActivityType.WALK] : [distance],
    [ActivityType.YOGA] : [averageHeartrate]
  }),
  defaultTo([averageHeartrate, maxHeartrate]),
  prepend(time)
)(activityType);

/** The action that the user just did, in english */
const activityVerb = (activityType: string) => pipe(
  switchcase({
    [ActivityType.RIDE]       : "went for a ride",
    [ActivityType.RUN]        : "went for a run",
    [ActivityType.YOGA]       : "did some yoga",
    [ActivityType.CROSSFIT]   : "did crossfit",
    [ActivityType.WEIGHT_TRAIN]: "lifted some weights",
    [ActivityType.HIKE]       : "went on a hike",
    [ActivityType.WALK]       : "went on a walk",
    [ActivityType.ROCK_CLIMB] : "went rock climbing",
    [ActivityType.WORKOUT]    : "did a workout"
  }),
  defaultTo(`did a workout [${activityType}]`)
)(activityType)

export const createActivityEmbed = ({member, user, exp, activity, weeklyExp}: CreateProps): Embed => ({
  title       : activity.name,
  description : activity.description || "",
  color       : 0xFC4C02,
  thumbnail   : { 
    url: member.avatar 
  },
  author: { 
    name: heading(
      ActivityModel.genderedEmoji(user.gender)(activity.type),
      member.displayName, 
      activity.type
    ) 
  },
  fields: statFields(
    activity.getRaw(), 
    user.optedOutHR || !activity.hasHeartrate
  ),
  footer: { 
    text: footerText(exp, weeklyExp, (!user.optedOutHR && activity.hasHeartrate))
  }
})
