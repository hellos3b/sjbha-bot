import "./src/controllers/commands";
import "./src/controllers/web";
import "./src/controllers/schedule";

// todo: Reimplement the schedule
// todo: Add back in the roles remove / add on weekly

// // Now lets build the schedule rule dynamically, using the luxon date
// // so we can configure it timezone independent
// // see https://github.com/node-schedule/node-schedule#recurrence-rule-scheduling
// const rule = {
//   dayOfWeek : weekly_post_time.weekday,
//   hour      : weekly_post_time.hour,
//   minute    : weekly_post_time.minute,
//   second    : weekly_post_time.second
// };

// schedule.scheduleJob(rule, () => {
//   debug("Beginning weekly schedule update")
//   postWeeklyProgress()
// });


// export const weekly_post_hour = 8;
// export const wekely_post_weekday = 1;
// /** The time when the weekly update gets posted */
// export const weekly_post_time = DateTime.local()
//   .setZone(env.TIME_ZONE)
//   .set({ weekday: wekely_post_weekday, hour: weekly_post_hour, minute: 0, second: 0 })
//   .toLocal();

// /** Role ID for reward getting to best rank */
// export const role_rank_1 = roles.certified_swole;
// /** Role ID for reward getting to 2nd best rank */
// export const role_rank_2 = roles.max_effort;
// /** Role ID for reward getting to 3rd best rank */
// export const role_rank_3 = roles.break_a_sweat;