import schedule from "node-schedule";

import bastion from "@services/bastion";
import {
  debug, 
  weekly_post_time,
  post_to_channel, 
  role_rank_1, 
  role_rank_2, 
  role_rank_3
} from "@plugins/fit/config";

import Week from "../../domain/exp/Week";
import Rank from "../../domain/user/Rank";
import { getProgressForWeek, saveProgress } from "../../domain/exp/WeeklyProgressRepository";
import { getActivity } from "../../domain/strava/ActivityRepository";
import { SerializedUser } from "../../domain/user/User";

import { createWeeklyEmbed } from "./embeds/WeeklyEmbed";
import { createProgress } from "./embeds/Progress";



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


//
// Displays an overview of stats including averages and current level
//
export async function postWeeklyProgress() {
  const week = Week.previous();
  
  const progress = await getProgressForWeek(week);
  progress.applyPromotions();
  await saveProgress(progress);

  const report = progress.getProgressReport();

  // Apply roles
  await updateRankRoles(report.users);

  // Convert user IDs to hash map of nicknames
  const userNameMap = report.users
    .reduce<Record<string, string>>((map, user) => {
      const member = bastion.getMember(user.discordId);
      map[user.discordId] = member.displayName;
      return map;
    }, {});

  // get the biggest activity (+ details)
  const biggest = progress.getBiggestActivity();
  let biggestActivity;

  if (biggest) {
    const activity = await getActivity(biggest.discordId, biggest.activityId);
    biggestActivity = {
      title : activity.name,
      discordId: biggest.discordId,
      exp   : biggest.exp.total
    };
  }

  // Build the main embed
  const embed = createWeeklyEmbed({
    week, userNameMap, report, biggestActivity
  });

  // Now just the progress
  const progressReport = createProgress({
    userNameMap, report
  });

  await bastion.sendTo(post_to_channel, embed);
  await bastion.sendTo(post_to_channel, progressReport);
}

async function updateRankRoles(users: SerializedUser[]) {
  debug("Updating roles for users")

  for (var i = 0; i < users.length; i++) {
    const member = bastion.getMember(users[i].discordId);
    const rank = new Rank(users[i].fitScore);

    switch (rank.rank) {
      case 6: {
        Promise.all([
          member.roles.add(role_rank_1),
          member.roles.remove(role_rank_2),
          member.roles.remove(role_rank_3)
        ]);
        break;
      }

      case 5: {
        Promise.all([
          member.roles.remove(role_rank_1),
          member.roles.add(role_rank_2),
          member.roles.remove(role_rank_3)
        ]);
        break;
      }

      case 4: {
        Promise.all([
          member.roles.remove(role_rank_1),
          member.roles.remove(role_rank_2),
          member.roles.add(role_rank_3)
        ]);
        break;
      }

      case 3: {
        Promise.all([
          member.roles.remove(role_rank_1),
          member.roles.remove(role_rank_2),
          member.roles.remove(role_rank_3)
        ]);
        break;
      }

      // Let's ignore default for now, so anyone who's not at least rank 3
      // we don't need to... worry about their rank. But if something messes up
      // with the roles, we know where to look!
      default: {}
    }
  }
}