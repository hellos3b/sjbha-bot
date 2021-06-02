import { Instance, MessageHandler } from '@sjbha/app';
import { MessageEmbed } from 'discord.js';
import { DateTime, Interval } from 'luxon';
import { isType } from 'variant';
import * as R from 'ramda';

import * as Workout from '../db/workout';

import { ActivityType } from '../common/StravaClient';

export const leaders : MessageHandler = async message => {
  const thirtyDays = Interval.before (DateTime.local (), { days: 30 });
  const workouts = await Workout
    .find ({ timestamp: Workout.between (thirtyDays) })
    .then (WorkoutCollection.from);

  // Each user along with their recent history
  const discordIds = workouts.getUserIds ();

  // Prefetch & create a dict of username ids -> display names
  const usernameById = await Promise.all (discordIds.map (discordId => 
    Instance.fetchMember (discordId)
      .then (member => ({ [discordId]: member.displayName }))
      .catch (_ => ({ [discordId]: 'Error' }))
  )).then (R.mergeAll);

  const embed = new MessageEmbed ()
    .setColor (0xffffff)
    .setTitle ('Leaders')
    .setDescription ('Top EXP Earners in the last 30 days, per activity')
    .setFooter ('Only HR activities are considered for leaders');

  for (const activity of workouts.getActivities ()) {
    const [first, second] = discordIds
      .map (discordId => workouts.getActivityForUser (discordId, activity))
      .filter (history => history.exp > 0)
      .sort ((a, b) => a.exp > b.exp ? -1 : 1);

    let leaders = '';

    leaders += `🏆 ${usernameById[first.discordId]} • **${first.exp.toFixed (1)}** (${first.count})`;

    if (second) {
      leaders += `\n🥈 ${usernameById[first.discordId]} • **${first.exp.toFixed (1)}** (${first.count})`;
    }

    embed.addField (activity, leaders);
  }

  message.channel.send (embed);
}

class WorkoutCollection {
  private constructor (
    private readonly workouts: Workout.Workout[]
  ) {}

  static from = (workouts: Workout.Workout[]) : WorkoutCollection => {
    // Only HR workouts are taken into account
    const valid = workouts.filter (w => isType (w.exp, Workout.Exp.hr));

    return new WorkoutCollection (valid);
  }

  getUserIds () : string[] {
    return R.uniq (this.workouts.map (w => w.discord_id));
  }

  getActivities () : ActivityType[] {
    return R.uniq (this.workouts.map (w => <ActivityType>w.activity_type));
  }

  getActivityForUser = (discordId: string, type: ActivityType) : UserActivityExp => 
    UserActivityExp.create (
      discordId,
      this.workouts.filter (w => w.discord_id === discordId && w.activity_type === type)
    );
}

class UserActivityExp {
  readonly discordId: string;

  readonly exp: number;

  readonly count: number;

  private constructor (discordId: string, workouts: Workout.Workout[]) {
    this.discordId = discordId;

    this.exp = workouts
      .map (w => Workout.expTotal (w.exp))
      .reduce (R.add, 0);

    this.count = workouts.length;
  }

  static create = (discordId: string, allWorkouts: Workout.Workout[]) : UserActivityExp => {
    const workouts = allWorkouts.filter (w => w.discord_id === discordId);

    return new UserActivityExp (discordId, workouts);
  }
}