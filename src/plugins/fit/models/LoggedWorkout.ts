import * as R from "ramda";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as Ord from "fp-ts/Ord";
import { pipe, flow, constant } from "fp-ts/lib/function";

import * as db from "@packages/db";
import { ConflictError, DecodeError, InvalidArgsError, NotFoundError } from "@packages/common-errors";
import { Interval, DateTime } from "luxon";
import { Workout } from "./Workout";
import {User} from "./User";
import * as Week from "./Week";

const collection = db.collection<LoggedWorkout>('fit-exp');

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

export const insert = (workout: LoggedWorkout) => {
  if (!workout.discord_id)
    return TE.left(InvalidArgsError.create("Trying to log a workout but no user is provided"));
  if (!workout.activity_id)
    return TE.left(InvalidArgsError.create("Trying to save workout without mapping to an activity"));

  const save = pipe(
    collection(), 
    db.insert <LoggedWorkout>(workout)
  );

  return pipe(
    collection(),
    db.findOne<LoggedWorkout> 
      ({activity_id: workout.activity_id}),
    TE.map
      (ConflictError.lazy(`Could not save LoggedWorkout: activity id '${workout.activity_id}' (${workout.activity_name}) already exists`)),
    TE.swap,
    TE.chainW
      (err => (err instanceof NotFoundError) ? save : TE.left(err))
  );
}

export const fetchLastDays = (days: number, user: User) => {
  const interval = Interval.before(DateTime.local(), {days});
  return find(interval)({discord_id: user.discordId})
};

// export const fetchCurrentWeek = () => find(Week.current())

// export const fetchInterval = (interval: Interval) => 
//   find()
//     ({discord_id: user.discordId});

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