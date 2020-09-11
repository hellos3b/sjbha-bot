import Debug from "debug";
import {weekly_exp_goal, points_per_goal} from "@plugins/fit/config";
import Rank from "./Rank";
import { UserSchema } from "../../db/UserCollection";

const debug = Debug("c/fit:fit-score");

const MIN_SCORE = 0;
const MAX_SCORE = 100;

export default class FitScore {
  private _score: number;

  constructor(fitScore: number = 0) {
    this._score = clamp(MIN_SCORE, MAX_SCORE, fitScore);
  }

  get value() {
    return this._score;
  }

  get rank() {
    return new Rank(this._score);
  }

  public getDetails(): FitScoreDetails {
    const rank = this.rank;

    return {
      score   : this._score,
      rank    : rank.rank,
      rankName: rank.name
    };
  }

  public updateFitScore(exp: number): FitUpdate {
    const prevRank = this.rank;

    // If you reached the goal, you get points
    if (exp >= weekly_exp_goal) {
      this._score += points_per_goal;

      debug("goal reached! +%o", weekly_exp_goal);
    } else {
      const pointsLost = lerp(5, 0, exp / weekly_exp_goal);
      this._score -= pointsLost;

      debug("lost %o points", pointsLost);
    }

    // Score must be squeezed in bound
    this._score = clamp(MIN_SCORE, MAX_SCORE, this._score);

    return {
      prevRank,
      newRank: this.rank
    };
  }

  public static create(fitScore: number) {
    return new FitScore(fitScore);
  }

  public static createFromDb(user: UserSchema) {
    return new FitScore(user.fitScore);
  }
}

export interface FitScoreDetails {
  score: number;
  rank: number;
  rankName: string;
}

export interface FitUpdate {
  prevRank: Rank;
  newRank: Rank;
}

// quick helper method
const clamp = (min: number, max: number, value: number) => Math.min(Math.max(value, min), max);
const lerp = (start: number, end: number, time: number) => start * (1 - time) + end * time;