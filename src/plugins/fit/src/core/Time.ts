import * as IO from "fp-ts/IO";
import {pipe} from "fp-ts/function";
import { DateTime, Interval, Duration } from "luxon";
import * as env from "@app/env";

const now: IO.IO<DateTime> = () => DateTime.local().setZone(env.TIME_ZONE);

export const weekFromDate = (date: DateTime) => Interval.after(
  weekStart(date), 
  Duration.fromObject({days: 7})
);

export const thisWeek = pipe(now, IO.map(weekFromDate));
export const isThisWeek = (date: DateTime) => date.equals(thisWeek().start);

export const lastWeek = pipe(
  now,
  IO.map(_ => _.minus({days: 7})),
  IO.map(weekFromDate)
);

/**
 * A week is an interval that starts on Monday at 1am
 * This method is for finding that timestamp based on any date
 */
const weekStart = (date: DateTime) => {
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
  IO.map(_ => Interval.before(_, {days}))
)