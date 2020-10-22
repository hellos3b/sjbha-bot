import {
  Activity,
  ActivityType
} from "../data/strava-types";

import * as R from "ramda";
import * as F from "fluture";
import {Maybe} from "purify-ts";
import * as FP from "../utils/fp-utils";
import * as User from "./user";
import * as api from "../data/strava";

import bastion from "@services/bastion";
import * as Config from "../config";
import { DateTime } from "luxon";

// re-exports
export type {
  Activity as Model
};

/****************************************************************
 *                                                              *
 * Futures [IO]                                                 *
 *                                                              *
 ****************************************************************/

export const getLastMonth = (user: User.Model) => R.pipe(
  api.activities({})
)(user.refreshToken)


/****************************************************************
 *                                                              *
 * Activity                                                     *
 *                                                              *
 ****************************************************************/

/** Get the date for when the activity was started, as a Luxon time */
export const started = (activity: Activity) => DateTime.fromISO(activity.start_date);

export type GenderedEmojis = (activityType: string) => string;

const maleEmojis: GenderedEmojis = R.pipe(
  FP.switchcase(Config.male_emojis),
  R.defaultTo(Config.male_emojis.default)
);

const femaleEmojis: GenderedEmojis = R.pipe(
  FP.switchcase(Config.female_emojis),
  R.defaultTo(Config.female_emojis.default)
);

/** Gets the emoji from the config */
export const genderedEmoji = FP.switchcase({
  "M": maleEmojis,
  "F": femaleEmojis
})

/****************************************************************
 *                                                              *
 * Aggregate                                                    *
 *                                                              *
 ****************************************************************/

/** Returns the most recent activity recorded */
export const mostRecent = R.pipe(
  FP.sortByProp<Activity> ("start_date"),
  FP.last
)

export const groupByType = R.groupBy ((a: Activity) => a.type);

export const totalTime = R.reduce(
  (time: number, a: Activity) => time + a.elapsed_time,
  0
)

export const summary = (activities: Activity[]) => ({
  type      : activities[0].type,
  totalTime : totalTime(activities),
  count     : activities.length
})

export type Summary = ReturnType<typeof summary>;