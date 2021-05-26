import * as R from "ramda";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe, flow } from "fp-ts/lib/function";

import { Interval, DateTime } from "luxon";
import { ConflictError, DecodeError, InvalidArgsError, NotFoundError } from "@packages/common-errors";
import logger from "@packages/logger";
import * as db from "@packages/db";

import type {API} from "../app/strava";

import { Workout } from "./Workout";
import {User} from "./User";
import * as Week from "./Week";

const collection = db.collection<LoggedWorkout>('fit-exp');
const log = logger("fit");

export type LoggedWorkout = t.TypeOf<typeof LoggedWorkoutT>;
const LoggedWorkoutT = t.interface({
  discord_id: t.string,
  activity_id: t.number,
  activity_name: t.string,
  timestamp: t.string,
  activity_type: t.string,
  exp_type: t.union([t.literal('hr'), t.literal('time')]),
  exp_gained: t.number,
  exp_vigorous: t.number
});

const decode = flow(
  t.array(LoggedWorkoutT).decode, 
  E.mapLeft(DecodeError.fromError)
);

export const recent = () => pipe(
  collection(),
  db.aggregate <LoggedWorkout>([
    {"$sort": { "timestamp": -1 }},
    {"$limit": 20}
  ]),
  TE.chainEitherKW (decode)
)

export const find = (interval: Interval) => {
  return (q: db.Query<LoggedWorkout> = {}) => pipe(
    collection(),
    db.find <LoggedWorkout>({
      ...q,
      timestamp: {
        $lt: interval.end.toISO(),
        $gt: interval.start.toISO()
      }
    }),
    TE.chainEitherKW (decode)
  );
};

export const fetch = (id: number) => pipe(
  collection(),
  db.findOne<LoggedWorkout>({activity_id: id})
)

export const remove = (id: number) => pipe(
  collection(),
  db.deleteOne<LoggedWorkout>({activity_id: id})
);

export const insert = (workout: LoggedWorkout) => {
  if (!workout.discord_id)
    return TE.left(InvalidArgsError.create("Trying to log a workout but no user is provided"));
  if (!workout.activity_id)
    return TE.left(InvalidArgsError.create("Trying to save workout without mapping to an activity"));

  const save = () => pipe(
    collection(), 
    db.insert <LoggedWorkout>(workout)
  );

  log.debug({workout}, "Inserting new LoggedWorkout");

  return pipe(
    collection(),
    db.findOne<LoggedWorkout> ({activity_id: workout.activity_id}),
    TE.map (ConflictError.lazy(`Could not save LoggedWorkout: activity id '${workout.activity_id}' (${workout.activity_name}) already exists`)),
    TE.swap,
    TE.chainW (err => (err instanceof NotFoundError) ? save() : TE.left(err))
  );
}

export const fetchLastDays = (days: number) => {
  return (q: db.Query<LoggedWorkout>) => {
    const interval = Interval.before(DateTime.local(), {days});
    return find(interval)(q);
  }
};

export const create = (props: LoggedWorkout = {
  discord_id: "",
  activity_id: -1,
  activity_name: "",
  timestamp: "",
  activity_type: "",
  exp_type: "time",
  exp_gained: 0,
  exp_vigorous: 0
}) => ({

  forUser: (user: User) => create({
    ...props,
    discord_id: user.discordId
  }),

  forWorkout: (workout: Workout) => create({
    ...props,
    activity_id: workout.id,
    activity_name: workout.title,
    timestamp: workout.timestamp.toISO(),
    activity_type: workout.type
  }),

  withExp: (type: LoggedWorkout["exp_type"], moderate: number, vigorous: number) => create({
    ...props,
    exp_type: type,
    exp_gained: moderate + vigorous,
    exp_vigorous: vigorous
  }),

  build: () => props
});

export const sumExp = (logs: LoggedWorkout[]) => logs
  .map(_ => _.exp_gained)
  .reduce(R.add, 0);

export const filterThisWeek = () => {
  const week = Week.current();
  return (logs: LoggedWorkout[]) => logs
    .filter(w => pipe(
      DateTime.fromISO (w.timestamp),
      date => week.contains(date)
    ));
};

export const emoji = (user: User, workout: LoggedWorkout) => {
  if (user.gender === "F") {
    switch (<API.ActivityType>workout.activity_type) {
      case "Run": return "🏃";
      case "Ride": return "🚴";
      case "Yoga": return "🧘‍♂️";
      case "Hike": return "⛰️";
      case "Walk": return "🚶‍♂️";
      case "Crossfit":
      case "WeightTraining": return "🏋️‍♂️";
      case "RockClimbing": return "🧗‍♂️";
      default: return "🤸‍♂️";
    }
  } else {
    switch (<API.ActivityType>workout.activity_type) {
      case "Run": return "🏃‍♀️";
      case "Ride": return "🚴‍♀️";
      case "Yoga": return "🧘‍♀️";
      case "Hike": return "⛰️";
      case "Walk": return "🚶‍♀️";
      case "Crossfit":
      case "WeightTraining": return "🏋️‍♀️";
      case "RockClimbing": return "🧗‍♀️";
      default: return "🤸‍♀️";
    }
  }
}