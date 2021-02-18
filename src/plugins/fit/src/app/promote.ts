import * as R from "ramda";
import {flow} from "fp-ts/function";
// import * as O from "fp-ts/Option";
// import * as w from "./Workout";
// import * as hr from "./Heartrate";
// import * as Time from "./Time";

// const max_fit_score = 100;

// const no_rank = 'Bushtit';
// const ranks = [
//   'Hummingbird', 
//   'Goldfinch', 
//   'Thrasher',
//   'Kingfisher', 
//   'Peregrine Falcon', 
//   'Golden Eagle'
// ];

/**
 * Represents a soft streak. The higher the value, the cooler rank name you get
 */
// export type FitScore = Object & {
//   /** Current fit score */
//   readonly value: number;
//   /** The name of the current rank */
//   readonly rank: string;
// }

/**
 * Constructor for `FitScore`
 */
// export const score = (value: number): FitScore => {
//   return R.clamp(0, max_fit_score)(value);
// }

/**
 * Get the name of a rank, from a fit score value
 */
// const rank = flow(
//   R.divide(20),
//   Math.floor,
//   R.clamp(0, ranks.length),
//   i => ranks[i]
// )







// /**
//  * Increase the fit score
//  */
// export const incScore = (amt: number) => {
//   return (score: FitScore) => fitScore(score.value + amt);
// };

// /**
//  * Decrease the fit score
//  */
// export const decScore = (amt: number) => {
//   return (score: FitScore) => fitScore(score.value - amt);
// };

// /**
//  * Increase or decrease the FitScore, dependent on how much exp you got
//  * @param exp The total amount of EXP for the week
//  */
// export const levelUpScore = (exp: Exp) => {
//   const percentToGoal = exp.value / weekly_exp_goal;
//   return (percentToGoal >= 1) 
//     ? incScore(fit_score_raise_amount) 
//     : decScore(fit_score_raise_amount * (1 - percentToGoal));
// };