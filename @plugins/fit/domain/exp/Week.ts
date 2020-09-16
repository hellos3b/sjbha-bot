import {DateTime} from "luxon";
import {TIME_ZONE} from "@app/env";

/**
 * Represents a week, in local timezone
 */
export default class Week {
  /** Represents the monday of "this" week */
  public readonly start: DateTime;
  public readonly end: DateTime;

  private constructor(start: DateTime) {
    this.start = start;
    this.end = this.start.plus({week: 1});
  }

  get id() {
    return this.start.toFormat("yyyy-M-dd");
  }

  public static createFromDate(timestamp: DateTime) {
    const start = getWeekStart(timestamp);
    return new Week(start);
  }

  /** Get the current week */
  public static current() {
    const timestamp = DateTime
      .local()
      .setZone(TIME_ZONE);

    return Week.createFromDate(timestamp);
  }

  /** Get the previous week */
  public static previous() {
    const timestamp = DateTime
      .local()
      .setZone(TIME_ZONE)
      .minus({week: 1});

    return Week.createFromDate(timestamp);
  }
}

/**
 * Finds the start of a week from a timestamp.
 * We check the day of the week and assign it to either the previous monday
 * or the one in the same "week"
 */
function getWeekStart(timestamp: DateTime) {
  // If the timestamp is on Sunday, use the previous monday
  if (timestamp.weekday === 0) {
    return timestamp
      .minus({ day: 6 })
      .set({hour: 1, minute: 0, second: 0});
  }
  
  // We leak into monday at 1am
  if (timestamp.weekday === 1 && timestamp.hour <= 1) {
    return timestamp.set({weekday: 1, hour: 1, minute: 0, second: 0 });      
  }

  return timestamp
    .set({ weekday: 1 })
    .set({hour: 1, minute: 0, second: 0 });      
}