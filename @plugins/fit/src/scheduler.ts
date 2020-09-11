import schedule from "node-schedule";
import {debug, weekly_post_time} from "@plugins/fit/config";
import {postWeeklyProgress} from "./bot/controller";

export default function scheduler() {
  // Now lets build the schedule rule dynamically, using the luxon date
  // so we can configure it timezone independent
  // see https://github.com/node-schedule/node-schedule#recurrence-rule-scheduling
  const rule = {
    dayOfWeek : weekly_post_time.weekday,
    hour      : weekly_post_time.hour,
    minute    : weekly_post_time.minute,
    second    : weekly_post_time.second
  };

  schedule.scheduleJob(rule, () => {
    debug("Beginning weekly schedule update")
    postWeeklyProgress()
  });
};