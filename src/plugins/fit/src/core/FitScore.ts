import * as R from "ramda";
import {pipe} from "fp-ts/function";

export type FitScore = {
  readonly _tag: "Score";
  /** Current fit score */
  readonly value: number;
  /** The name of the current rank */
  readonly rank: string;
}

export const score = (value: number): FitScore => {
  const rankValue = (value === 0) ? 0 : pipe(value, Math.floor, R.inc);
  const names = ['Bushtit', 'Hummingbird', 'Goldfinch', 'Thrasher',
    'Kingfisher', 'Peregrine Falcon', 'Golden Eagle'];
  const rank = names[R.clamp(0, names.length)(rankValue)];

  return {_tag: "Score", value, rank};
}


export const inc = (amt: number) => (fitScore: FitScore): FitScore => score(fitScore.value + amt);