// import {Codec, string, number, GetType} from "purify-ts";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import {flow} from "fp-ts/function";
import { Interval } from "luxon";

import {collection} from "@packages/collection/collection";

import * as history from "../core/History";
import { pipe } from "fp-ts/lib/pipeable";
import { DecodeError } from "@packages/common-errors";
import { FilterQuery } from "mongodb";

export const HistoricalWorkoutCodec = t.interface({
  discordId: t.string,
  activityId: t.string,
  timestamp: t.string,
  activity_type: t.string,
  exp_type: t.union([
    t.literal('hr'),
    t.literal('time')
  ]),
  exp_gained: t.number,
  exp_vigorous: t.number
});

export type HistoricalWorkout = t.TypeOf<typeof HistoricalWorkoutCodec>;
const Workouts = collection<HistoricalWorkout>('fit-exp');

const mapToModel = flow(
  t.array(HistoricalWorkoutCodec).decode,
  E.mapLeft(DecodeError.fromError),
  E.map(history.fromDatabase)
);

const intervalFilter = (interval: Interval): FilterQuery<HistoricalWorkout> => ({
  timestamp: {
    $gte: interval.start.toISO(),
    $lte: interval.end.toISO()
  }
});

export const fetchInterval = (week: Interval) => {
  return (f: FilterQuery<HistoricalWorkout> = {}) => pipe(
    Workouts.find({...f, ...intervalFilter(week)}),
    TE.chainEitherK(mapToModel)
  );
};