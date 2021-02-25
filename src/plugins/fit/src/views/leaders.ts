import * as R from "ramda";
import * as O from "fp-ts/Option";
import {pipe} from "fp-ts/function";
import { color, field, description, embed, title, EmbedReader, footer } from "@packages/embed";

import * as u from "../models/User";
import * as lw from "../models/LoggedWorkout";

// todo: this doesn't work with 0 HR logs
export const render = (users: u.User[], workouts: lw.LoggedWorkout[]) => {
  const types = pipe(
    workouts.map(w => w.activity_type), 
    R.uniq,
    t => t.sort()
  );

  const first = ([id, logs, exp]: WorkoutResult) => `🏆 <@${id}> • **${exp.toFixed(1)}** exp (${logs.length} workouts)`;
  const second = ([id, logs, exp]: WorkoutResult) => `🥈 <@${id}> • **${exp.toFixed(1)}** exp (${logs.length} workouts)`;

  const leaders = pipe(
    types.map(getLeader(workouts)),
    leaders => leaders.reduce((res, b) => [
      ...res,
      field(b.type)(
        pipe(b.first, O.map(first), O.getOrElse(() => "")) + "\n" +
        pipe(b.second, O.map(second), O.getOrElse(() => ""))
      )
    ], [] as EmbedReader[])
  );

  return embed(
    color(0xffffff),
    title("Leaders"),

    description("Top EXP in the last 30 days, per activity"),
    ...leaders,

    footer("Only HR activities are considered for leaders")
  )
};

type WorkoutResult = [string, lw.LoggedWorkout[], number];
const getLeader = (workouts: lw.LoggedWorkout[]) => {
  return (type: string) => pipe(
    workouts.filter(w => w.activity_type === type),
    R.groupBy(w => w.discord_id),
    record => Object
      .entries(record)
      .map(([user, logs]): WorkoutResult => [user, logs, lw.sumExp(logs)])
      .sort((a, b) => a[2] > b[2] ? -1 : 1),
    leaders => ({
      type,
      first: O.fromNullable(leaders[0]),
      second: O.fromNullable(leaders[1])
    })
  );
};