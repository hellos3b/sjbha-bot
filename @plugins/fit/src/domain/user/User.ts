import {debug} from "@plugins/fit/config";
import { UserSchema } from "../../db/UserCollection";
import Activity from "../strava/Activity";

import Profile from "./Profile";
import Level from "./Level";
import FitScore, { FitScoreDetails } from "./FitScore";

export interface UserProfile {
  level   : number;
  exp     : number;
  gender  : string;
  fitScore: FitScoreDetails;
}

export interface SerializedUser {
  discordId : string;
  gender    : string;
  exp       : number;
  maxHR     : number;
  fitScore  : number;
}

export default class User {
  public readonly id: string;
  private readonly profile: Profile;
  private readonly level: Level;
  private readonly fitScore: FitScore;

  private constructor(id: string, profile: Profile, level: Level, fitScore: FitScore) {
    this.id = id;
    this.profile = profile;
    this.level = level;
    this.fitScore = fitScore;
  }

  get rank() {
    return this.fitScore.rank;
  }

  // actions
  updateGender(gender: string) {
    debug("%o update gender to %o", this.id, gender);
    this.profile.updateGender(gender);
  }

  updateMaxHeatrate(hr: number) {
    debug("%o update max HR to %o", this.id, hr);
    this.level.updateMaxHeartrate(hr);
  }

  addActivity(activity: Activity) {
    debug("%o adding activity %o", this.id, activity.id);
    const exp = this.level.gainExperience(activity);
    return exp;
  }

  updateFitScore(exp: number) {
    debug("%o update fit score with %o exp", this.id, exp);
    this.fitScore.updateFitScore(exp);
  }

  // exposed properties
  getProfile(): UserProfile {
    return {
      level     : this.level.level,
      exp       : this.level.exp,
      gender    : this.profile.gender,
      fitScore  : this.fitScore.getDetails()
    }
  }

  serialize(): SerializedUser {
    return {
      discordId : this.id,
      gender    : this.profile.gender,
      exp       : this.level.exp,
      maxHR     : this.level.maxHR,
      fitScore  : this.fitScore.value
    }
  }

  public static create(id: string, profile: Profile, level: Level, fitScore: FitScore) {
    return new User(id, profile, level, fitScore);
  }

  public static createFromDb(user: UserSchema) {
    return new User(
      user.discordId,
      Profile.createFromDb(user),
      Level.createFromDb(user),
      FitScore.createFromDb(user)
    )
  }
}