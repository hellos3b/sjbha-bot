import * as R from "ramda";
import {pipe, flow, constant} from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as w from "./Workout";
import * as hr from "./Heartrate";

const min_score = 0;

export const no_rank = 'Bushtit';
export const ranks = [
  'Hummingbird', 
  'Goldfinch', 
  'Thrasher',
  'Kingfisher', 
  'Peregrine Falcon', 
  'Golden Eagle'
];

export type EXP = {
  readonly _tag: "EXP";
  readonly value: number;
}

/**
 * Represents a soft streak. The higher the value, the cooler rank name you get
 */
export type FitScore = {
  readonly _tag: "Score";
  /** Current fit score */
  readonly value: number;
  /** The name of the current rank */
  readonly rank: string;
}

export const exp = (value: number): EXP => ({
  _tag: "EXP",
  value
});

export const addExp = (amt: EXP) => {
  return (xp: EXP) => exp(xp.value + amt.value);
};

/**
 * Use a workout's running time to calculate EXP
 */
export const expFromTime = (workout: w.Workout) => exp(workout.elapsed.value);

/**
 * Use a heart rate zones from a workout to calculate exp
 */
export const expFromZones = (zones: hr.TimeInZones) => exp(zones.moderate + (zones.vigorous * 2));

export const expFromWorkout = (workout: w.Workout) => {
  const stream = pipe(workout.heartrate, O.map(_ => _.stream));

  return flow(
    O.map(hr.timeInZone), 
    O.ap(stream),
    O.fold(
      constant (expFromTime(workout)), 
      expFromZones
    )
  );
}

export const fitScore = (value: number): FitScore => {
  if (value === 0)
    return {_tag: "Score", value, rank: no_rank};
  
  const clamped = R.clamp(0, Infinity)(value);

  const rankNumber = pipe(
    Math.floor(clamped / 20),
    R.clamp(0, ranks.length)
  );

  const rank = ranks[rankNumber];

  return {_tag: "Score", value: clamped, rank};
}

/**
 * Increase the fit score
 */
export const inc = (amt: number) => {
  return (score: FitScore) => fitScore(score.value + amt);
};