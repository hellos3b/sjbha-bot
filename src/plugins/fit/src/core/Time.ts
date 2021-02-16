import * as IO from "fp-ts/IO";
import {pipe} from "fp-ts/function";
import * as L from "luxon";

import format from "@packages/string-format";
import * as env from "@app/env";

export type Duration = L.Duration;

export const seconds = (seconds: number): Duration => L.Duration.fromObject({seconds});

const now: IO.IO<L.DateTime> = () => L.DateTime.local().setZone(env.TIME_ZONE);

export const weekFromDate = (date: L.DateTime) => L.Interval.after(
  weekStart(date), 
  L.Duration.fromObject({days: 7})
);

export const thisWeek = pipe(now, IO.map(weekFromDate));
export const isThisWeek = (date: L.DateTime) => date.equals(thisWeek().start);

export const lastWeek = pipe(
  now,
  IO.map(_ => _.minus({days: 7})),
  IO.map(weekFromDate)
);

/**
 * A week is an interval that starts on Monday at 1am
 * This method is for finding that timestamp based on any date
 */
const weekStart = (date: L.DateTime) => {
  // If the timestamp is on Sunday, use the previous monday
  if (date.weekday === 0) {
    return date
      .minus({ day: 6 })
      .set({hour: 1, minute: 0, second: 0});
  }
  
  // We leak into monday at 1am
  if (date.weekday === 1 && date.hour <= 1) {
    return date.set({weekday: 1, hour: 1, minute: 0, second: 0 });      
  }

  return date
    .set({ weekday: 1 })
    .set({hour: 1, minute: 0, second: 0 });  
}

export const lastNDays = (days: number) => pipe(
  now,
  IO.map(_ => L.Interval.before(_, {days}))
)

// Formatting
const pad = (v: number) => v.toString().padStart(2, "0");

/**
 * Formats `seconds` into a friendly format such as "15m 32s"
 * Best used to describe elapsed time (hence the name)
 */
export const formatElapsed = (d: Duration): string => {
  if (d.hours > 0) 
    return format('{0}h {1}m')(d.toFormat("h"), d.toFormat("mm"));

  if (d.minutes > 0) 
    return format('{0}m {1}s')(d.toFormat("m"), d.toFormat("ss"));

  return format('{0}s')(d.toFormat("ss"));
};