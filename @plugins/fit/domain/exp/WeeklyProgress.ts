import {chain, map, reduce} from "lodash";
import { UserSchema } from "../../db/UserCollection";
import WorkoutLogs from "../exp/WorkoutLogs";
import User, { SerializedUser } from "../user/User";
import Rank from "../user/Rank";
import { ExpSchema } from "../../db/ExpCollection";


export const PromotionType = {
  SAME: "same",
  PROMOTED: "promoted",
  DEMOTED: "demoted"
}

export interface Promotion {
  discordId: string;
  type: string;
  rank: Rank;
  points: number;
  newScore: number;
  exp: number;
}

export interface ProgressReport {
  users       : SerializedUser[];
  activityCount: number;
  leaderboard : LeaderboardEntry[];
  promotions  : Promotion[];
}

export interface LeaderboardEntry {
  discordId : string;
  exp       : number;
}

export default class WeeklyProgress {
  private readonly users: User[];
  private readonly workouts: WorkoutLogs;

  private promotions: Promotion[] = [];

  private constructor(users: User[], workouts: WorkoutLogs) {
    this.users = users;
    this.workouts = workouts;
  }

  get hasActivities() {
    return this.workouts.count > 0;
  }

  applyPromotions() {
    if (this.promotions.length) {
      throw new Error("Already ran promotions on this group of EXP!")
    }

    this.promotions = chain(this.users)
      .map(user => {
        const logs = this.workouts.getWorkoutsFor(user.id);
        // const prevRank = user.rank;

        const update = user.updateFitScore(logs.totalExp);

        let type = PromotionType.SAME;
        if (update.newRank.rank > update.prevRank.rank) {
          type = PromotionType.PROMOTED;
        }
        if (update.newRank.rank < update.prevRank.rank) {
          type = PromotionType.DEMOTED;
        }

        const progress: Promotion = {
          discordId: user.id,
          points: update.points,
          newScore: update.newScore,
          type,
          rank: user.rank,
          exp: logs.totalExp
        };

        return progress;
      })
      .value();
  }

  getProgressReport(): ProgressReport {
    return {
      users         : this.getSerializedUsers(),
      activityCount : this.workouts.count,
      leaderboard   : this.getLeaderboard(),
      promotions    : [...this.promotions]
    }
  }

  getSerializedUsers() {
    return this.users.map(u => u.serialize())
  }

  getLeaderboard(): LeaderboardEntry[] {
    return chain(this.users)
      .map(u => {
        const logs = this.workouts.getWorkoutsFor(u.id);
        return {
          discordId: u.id,
          exp: logs.totalExp
        };
      })
      .sortBy([i => i.exp])
      .reverse()
      .value();
  }

  getBiggestActivity() {
    return this.workouts.getBiggestWorkout();
  }

  public static create(users: User[], workouts: WorkoutLogs) {
    return new WeeklyProgress(users, workouts);
  }

  public static createFromDb(users: UserSchema[], workouts: ExpSchema[]) {
    return new WeeklyProgress(
      map(users, User.createFromDb),
      WorkoutLogs.createFromDb(workouts)
    );
  }
}