import * as Week from "fp-ts/IO";
import {pipe} from "fp-ts/function";
import * as L from "luxon";
import * as env from "@app/env";

const now: Week.IO<L.DateTime> = () => L.DateTime.local().setZone(env.TIME_ZONE);

export const weekFromDate = (date: L.DateTime) => L.Interval.after(
  weekStart(date), 
  L.Duration.fromObject({days: 7})
);

export const current = pipe(now, Week.map(weekFromDate));
export const isThisWeek = (date: L.DateTime) => date.equals(current().start);

export const previous = pipe(
  now,
  Week.map(_ => _.minus({days: 7})),
  Week.map(weekFromDate)
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
  Week.map(_ => L.Interval.before(_, {days}))
)