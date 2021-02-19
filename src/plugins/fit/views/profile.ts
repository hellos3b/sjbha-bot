import * as R from "ramda";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";
import * as ord from "fp-ts/Ord";
import * as tuple from "fp-ts/Tuple";
import {pipe, flow, constant} from "fp-ts/function";

import { color, author, embed, field } from "@packages/embed";

import * as u from "../models/User";
import * as lw from "../models/LoggedWorkout";

export const render = (user: u.User, workouts: lw.LoggedWorkout[]) => embed(
  color(0x4ba7d1),

  author(user.member.name, user.member.avatar),

  field("Fit score", true)
    (pipe(u.fitScore(user), fs => `${fs.value} (${fs.rank})`)),

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

  field("Favorite Workout")
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
const favorite = flow(
  R.countBy ((_: lw.LoggedWorkout) => _.activity_type),
  Object.entries,
  R.sortBy (tuple.snd),
  A.head,
  O.map (tuple.fst)
);