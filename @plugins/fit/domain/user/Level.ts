import { UserSchema } from "../../db/UserCollection";

import ExperiencePoints from "./ExperiencePoints";
import Activity from "../strava/Activity";

import {debug, exp_per_level} from "@plugins/fit/config";


export default class Level {
  private _exp: number;
  private _maxHR: number;

  protected constructor(exp: number = 0, maxHR: number = 0) {
    this._exp = exp;
    this._maxHR = maxHR;
  }

  get hasMaxHeartrate() {
    return !!this._maxHR;
  }

  get maxHR() {
    return this._maxHR;
  }

  get exp() {
    return this._exp;
  }

  get level() { 
    const level = Math.floor(this._exp / exp_per_level);
    const remainder = this._exp % exp_per_level;
    const progress = Math.floor(remainder / exp_per_level * 10)/10;

    return 1 + (level + progress);
  }

  public updateMaxHeartrate(hr: number) {
    if (hr !== 0 && (hr < 160 || hr > 220)) {
      throw new Error("HR needs to be between 160 and 220");
    }
    
    this._maxHR = hr;
  }

  public gainExperience(activity: Activity) {
    let exp: ExperiencePoints;
    
    if (this.hasMaxHeartrate && activity.hasHeartrate) {
      debug("calculating EXP with max HR %o", this._maxHR);
      const effort = activity.getEffort(this.maxHR);
      exp = ExperiencePoints.createFromSeconds(effort.moderate, effort.vigorous);
    } else {
      debug("calculating EXP from elapsed time");
      exp = ExperiencePoints.createFromSeconds(activity.elapsedTime.value, 0);
    }

    this._exp += exp.total;

    debug("gained %o experience points (%o+ %o++)", exp.total, exp.moderate, exp.vigorous);

    return exp;
  }

  public static create(exp: number, maxHR: number) {
    return new Level(exp, maxHR);
  }

  public static createFromDb(user: UserSchema) {
    return new Level(user.xp, user.maxHR);
  }
}