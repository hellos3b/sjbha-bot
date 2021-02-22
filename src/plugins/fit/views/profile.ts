import * as R from "ramda";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";
import * as ord from "fp-ts/Ord";
import * as tuple from "fp-ts/Tuple";
import {pipe, flow, constant} from "fp-ts/function";

import { color, author, embed, field, title } from "@packages/embed";

import * as u from "../models/User";
import * as lw from "../models/LoggedWorkout";

export const render = (user: u.User, workouts: lw.LoggedWorkout[]) => embed(
  color(0x4ba7d1),

  author(user.member.name, user.member.avatar),

  field("Rank", true)
    (pipe(u.rank(user), rank => `${rank} (${user.fitScore.toFixed(0)})`)),

  field("Total EXP", true)
    (formatExp(user.xp)),

  field("Weekly EXP", true)
    (pipe(workouts, lw.filterThisWeek(), lw.sumExp, formatExp)),

  field("Last Activity")
    (pipe(
      mostRecent(workouts), O.fold(
        constant("No workouts"), 
        _ => _.activity_name
      )
    )),

  field("Top Workout")
    (pipe(favorite(workouts), O.toNullable))
);

/**
 * Shortens XP values so they're only a few digits long
 * 52,123.124552 xp becomes `52.1k`
 */
const formatExp = (xp: number) => 
  (xp > 1000) 
    ? (xp / 1000).toFixed(1) + "k"
    : xp.toFixed(0);

/** 
 * Gets the most recent workout 
 */
const mostRecent = flow(    
  R.sortBy ((_: lw.LoggedWorkout) => _.timestamp),
  A.head
)

/**
 * Get's the user's most logged workout
 */
const favorite = (logs: lw.LoggedWorkout[]) => {
  const groups = pipe(logs, R.groupBy(_ => _.activity_type));
  const withCounts = Object.keys(groups)
    .map(key => ({
      type: key,
      count: groups[key].length,
      exp: lw.sumExp(groups[key])
    }));

  return pipe(
    withCounts,
    R.sort ((a, b) => a.exp > b.exp ? -1 : 1),
    A.head,
    O.map (({ count, type, exp}) => {
      const plural = count > 1 ? 'activities' : 'activity';
      return `**${type}**, with ${count} ${plural} / ${formatExp(exp)} xp`;
    })
  )
}