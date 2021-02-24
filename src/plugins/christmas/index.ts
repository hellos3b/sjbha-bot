import * as env from "@app/env";
import {message$} from "@app/bot";

import * as M from "@packages/discord-fp/Message";

import {DateTime} from "luxon";
import {pipe} from "fp-ts/function";

message$.pipe(
  M.startsWith("!christmas")
).subscribe(msg => pipe(
  countDaysUntilChristmas(),
  days => (days === 0) 
    ? `!!TODAY IS CHRISTMAS!!`
    : `ONLY ${days} ${pluralize("DAY")(days)} UNTIL CHRISTMAS!!`,
  festivize,
  M.replyTo(msg)
));

const festivize = (msg: string) => `🎄☃️☃️🎄🎁 ${msg} 🎁🎄☃️☃️🎄`;
const pluralize = (word: string) => (count: number) => word + (count === 1 ? '' : 's');

function countDaysUntilChristmas() {
  const now = DateTime.local()
    .setZone(env.TIME_ZONE)
    .set({hour: 0, minute: 0, second: 0, millisecond: 0});

  const christmas = DateTime.local()
    .setZone(env.TIME_ZONE)
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