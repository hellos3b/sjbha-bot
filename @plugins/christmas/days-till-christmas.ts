import { TIME_ZONE } from "@app/env";
import {DateTime} from "luxon";

export default function getDays() {
  const now = DateTime.local()
    .setZone(TIME_ZONE)
    .set({hour: 0, minute: 0, second: 0, millisecond: 0});

  const christmas = DateTime.local()
    .setZone(TIME_ZONE)
    .set({
      month: 12, day: 25,
      hour: 0, minute: 0, second: 0, millisecond: 0
    });

  let diff = christmas.diff(now, "days");

  // If it's already passed xmas, use next year's christmas
  if (diff.days < 0) {
    diff = christmas.set({year: now.year + 1}).diff(now, "days");
  }

  return Math.floor(diff.days);
}