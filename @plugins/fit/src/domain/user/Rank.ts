import {rank_names} from "@plugins/fit/config";

// todo: WHy this not default lol
export default class Rank {
  public rank: number;

  constructor(fitScore: number) {
    if (fitScore < 0 || fitScore > 100) {
      throw new Error("Invalid fit score for Rank. Should be between 0-100, but got " + fitScore);
    }

    if (fitScore === 0) {
      this.rank = 0;
    } else {
      this.rank = Math.floor(fitScore / 20) + 1;
    }
  }

  get name() {
    return rank_names[this.rank];
  }

  public static maxRank = 6;
}