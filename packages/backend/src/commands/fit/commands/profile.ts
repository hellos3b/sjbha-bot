import { MessageHandler } from '@sjbha/app';
import { MessageEmbed } from 'discord.js';
import { DateTime, Interval } from 'luxon';
import { Maybe } from 'purify-ts';
import * as R from 'ramda';
import fromNow from 'fromnow';

import * as User from '../db/user';
import * as Workout from '../db/workout';

import { currentWeek } from '../common/week';
import { ActivityType } from '../common/StravaClient';
import { activityEmoji } from '../common/activity-emoji';
import { getRank } from '../common/ranks';

export const profile : MessageHandler = async message => {
  const user = await User.findOne ({ discordId: message.author.id });

  if (!User.isAuthorized (user)) {
    message.reply ('You aren\'t set up with the Strava bot');

    return;
  }

  const member = Maybe.fromNullable (message.member);
  const username = member.mapOrDefault (m => m.displayName, message.author.username);
  const displayColor = member.mapOrDefault (m => m.displayColor, 0xcccccc);

  const embed = new MessageEmbed ();

  embed.setColor (displayColor);
  embed.setAuthor (username, message.author.displayAvatarURL ());

  // All workouts in the last 30 days
  const workouts = await Workout
    .find ({ timestamp: Workout.between (Interval.before (DateTime.local (), { days: 30 })) })
    .then (WorkoutCollection.of);

  // User's workouts in the last 30 days
  const profileWorkouts = workouts.filter (w => w.discord_id === user.discordId);

  // Small overview of favorite activity for the description
  // todo: check if i even care about this

  // if (profileWorkouts.length) {
  //   const recordedTypes = profileWorkouts.activityTypes ();
  //   const expByType = recordedTypes
  //     .map (type => ({ [type]: profileWorkouts.filter (w => w.activity_type === type).totalExp }))
  //     .reduce (R.mergeLeft, {});

  //   const sortedByExp = recordedTypes.sort ((a, b) => expByType[a] > expByType[b] ? -1 : 1);
  //   const favoriteType = sortedByExp[0];
  //   const favoriteCount = profileWorkouts
  //     .filter (w => w.activity_type === favoriteType)
  //     .length;

  //   embed.setDescription (`
  //     ${username} has recorded **${profileWorkouts.length}** activities in the last 30 days. 
  //     **${favoriteType}** was done most often with **${favoriteCount}** workouts
  //   `);
  // }
  // else {
  //   embed.setDescription ('No activities recorded in the last 30 days. Get to steppin!');
  // }

  // User's current rank name
  const rank = getRank (user.fitScore);
  embed.addField ('Rank', rank, true);
  
  // Lifetime EXP gained
  embed.addField ('Total EXP', formatExp (user.xp), true);

  // The start of the week, used for EXP promotion calculation
  const weekStart = currentWeek ().start.toUTC ();

  // Collection of workouts that apply to this week's promotion
  const weekly = profileWorkouts.filter (w => w.timestamp >= weekStart.toISO ());
  embed.addField ('Weekly EXP', formatExp (weekly.totalExp), true); 

  // The user's most recently recorded workout
  profileWorkouts.getRecent ()
    .map (w => [
      activityEmoji ({ type: <ActivityType>w.activity_type }, user.gender),
      w.activity_name,
      '•',
      fromNow (w.timestamp, { suffix: true, max: 1 })
    ])
    .ifJust (strs => embed.addField ('Last Activity', strs.join (' '), true));

  message.channel.send (embed);
}

/**
 * Helper class for dealing with an array of recorded workouts
 */
class WorkoutCollection {
  private constructor (
    private readonly workouts: Workout.Workout[]
  ) {}

  static of = (workouts: Workout.Workout[]) => new WorkoutCollection (workouts);

  /**
   * The sum of all EXP from every workout in this collection
   */
  get totalExp() : number {
    return this.workouts
      .map (workout => Workout.expTotal (workout.exp))
      .reduce (R.add, 0);
  }

  /**
   * How many workouts are in this collection
   */
  get length() : number {
    return this.workouts.length;
  }

  /**
   * Filter the collection
   * 
   * @returns A new WorkoutCollection that fits the criteria
   */
  filter(f: (workout: Workout.Workout) => boolean) : WorkoutCollection {
    const filtered = this.workouts.filter (f);

    return new WorkoutCollection (filtered);
  }

  /**
   * 
   * @returns A unique list of activity types in this collection
   */
  activityTypes = () : ActivityType[] => {
    const types = this.workouts.map (w => <ActivityType>w.activity_type);

    return R.uniq (types);
  }

  /**
   * 
   * @returns The most recently recorded workout, by timestamp
   */
  getRecent() : Maybe<Workout.Workout> {
    const sorted = this.workouts.sort ((a, b) => a.timestamp > b.timestamp ? -1 : 1);
  
    return Maybe.fromNullable (sorted[0])
  }
}

/**
 * Rounds and shortens an EXP value for display
 */
const formatExp = (amt: number) => 
  (amt >= 1000) ? (amt / 1000).toFixed (1) + 'k'
    : amt.toFixed (1)