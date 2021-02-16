import * as IO from "fp-ts/IO";
import {pipe} from "fp-ts/function";
import { DateTime, Interval, Duration } from "luxon";
import * as R from "ramda";
import * as env from "@app/env";
import * as db from "../io/history-db";
import * as xp from "./Exp";
import * as time from "./Time";

export type History = {
  value: HistoricalWorkout[];
}

export type HistoricalWorkout = {
  readonly exp: xp.EXP;
  readonly type: string;
  readonly timestamp: DateTime;
}

export const history = (workouts: HistoricalWorkout[]): History => ({value: workouts})

export const fromDatabase = (records: db.HistoricalWorkout[]) => history(
  records.map(data => ({
    exp: xp.exp(data.exp_gained),
    type: data.activity_type,
    timestamp: DateTime.fromISO(data.timestamp)
  }))
);

const filter = (f: (w: HistoricalWorkout) => boolean) => (h: History): History => history(h.value.filter(f));

export const toExp = (history: History): xp.EXP[] => history.value.map(_ => _.exp);

export const filterTime = (f: (t: DateTime) => boolean) => filter(_ => f(_.timestamp));
export const filterType = (f: (t: string) => boolean) => filter(_ => f(_.type));