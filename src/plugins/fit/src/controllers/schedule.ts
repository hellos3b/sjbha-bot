import schedule from "node-schedule";
import * as env from "@app/env";
import {DateTime} from "luxon";
import * as promote from "../app/promote";

export const weekly_post_hour = 8;
export const wekely_post_weekday = 1;


// /** Role ID for reward getting to best rank */
// export const role_rank_1 = roles.certified_swole;
// /** Role ID for reward getting to 2nd best rank */
// export const role_rank_2 = roles.max_effort;
// /** Role ID for reward getting to 3rd best rank */
// export const role_rank_3 = roles.break_a_sweat;

/** The time when the weekly update gets posted */
export const weekly_post_time = DateTime.local()
  .setZone(env.TIME_ZONE)
  .set({ weekday: wekely_post_weekday, hour: weekly_post_hour, minute: 0, second: 0 })
  .toLocal();

const rule = {
  dayOfWeek : weekly_post_time.weekday,
  hour      : weekly_post_time.hour,
  minute    : weekly_post_time.minute,
  second    : weekly_post_time.second
};

schedule.scheduleJob(rule, () => {
  promote.run()
});