import * as R from "ramda";
import {pipe, flow, constant} from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as w from "./Workout";
import * as hr from "./Heartrate";
import * as Time from "./Time";
import { HistoricalWorkout } from "../io/history-db";

export const weekly_exp_goal = 150;
export const fit_score_raise_amount = 5;
export const max_fit_score = 100;

export const no_rank = 'Bushtit';
export const ranks = [
  'Hummingbird', 
  'Goldfinch', 
  'Thrasher',
  'Kingfisher', 
  'Peregrine Falcon', 
  'Golden Eagle'
];

export type EXP = Object & {
  readonly _tag: "EXP";
  readonly value: number;
}

/**
 * Represents a soft streak. The higher the value, the cooler rank name you get
 */
export type FitScore = Object & {
  /** Current fit score */
  readonly value: number;
  /** The name of the current rank */
  readonly rank: string;
}

/**
 * Constructor for `EXP`
 */
export const exp = (value: number): EXP => ({
  _tag: "EXP",
  value, 
  toString() {
    if (value > 1000) 
      return (value / 1000).toFixed(1) + "k";

    return value.toFixed(0);
  }
});

export const addExp = (amt: EXP) => {
  return (xp: EXP) => exp(xp.value + amt.value);
};

/**
 * Get total amount of EXP from an array of EXP
 */
export const sum = (arr: EXP[]) => pipe(
  arr.map(_ => _.value),
  R.reduce(R.add, 0),
  exp
);

/**
 * Use a workout's running time to calculate EXP gained
 */
export const expFromTime = (time: Time.Duration) => exp(time.as("minutes"));

/**
 * Use heart rate zones from a workout to calculate EXP gained
 */
export const expFromZones = (zones: hr.Zones) => {
  return (stream: hr.Stream) => {
    const time = hr.timeInZone(zones)(stream);
    return exp(
      time.moderate.as("minutes") + (time.vigorous.as("minutes") * 2)
    );
  }
}

/**
 * Constructor for `FitScore`
 */
export const fitScore = (value: number): FitScore => {
  const clamped = R.clamp(0, max_fit_score)(value);
  const rank = (clamped === 0) ? no_rank : scoreToRank(clamped);

  return {
    value: clamped, 
    rank,
    toString() {
      return value.toFixed(0) + ` (${rank})`;
    }
  };
}

/**
 * Get the name of a rank, from a fit score value
 */
const scoreToRank = flow(
  R.divide(20),
  Math.floor,
  R.clamp(0, ranks.length),
  i => ranks[i]
)

/**
 * Increase the fit score
 */
export const incScore = (amt: number) => {
  return (score: FitScore) => fitScore(score.value + amt);
};

/**
 * Decrease the fit score
 */
export const decScore = (amt: number) => {
  return (score: FitScore) => fitScore(score.value - amt);
};

/**
 * Increase or decrease the FitScore, dependent on how much exp you got
 * @param exp The total amount of EXP for the week
 */
export const levelUpScore = (exp: EXP) => {
  const percentToGoal = exp.value / weekly_exp_goal;
  return (percentToGoal >= 1) 
    ? incScore(fit_score_raise_amount) 
    : decScore(fit_score_raise_amount * (1 - percentToGoal));
};