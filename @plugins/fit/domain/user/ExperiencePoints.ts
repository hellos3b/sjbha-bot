import {exp_multi, hard_multi} from "@plugins/fit/config";
import { ExpSchema } from "../../db/ExpCollection";

export default class ExperiencePoints {
  public readonly moderate: number;
  public readonly vigorous: number;

  protected constructor(moderateExp: number=0, vigorousExp: number=0) {
    this.moderate = moderateExp;
    this.vigorous = vigorousExp;
  }

  get total() {
    // We round the total because of floating point precision
    return this.moderate + this.vigorous;
  }

  get moderateRounded() {
    return round(this.moderate);
  }

  get vigorousRounded() {
    return round(this.vigorous);
  }

  public static createFromDb(exp: ExpSchema) {
    return ExperiencePoints.createFromSeconds(exp.moderate, exp.vigorous)
  }

  public static createFromSeconds(moderateSeconds: number, vigorousSeconds: number) {
    return ExperiencePoints.create(
      moderateSeconds * exp_multi,
      vigorousSeconds * exp_multi * hard_multi
    );
  }

  public static create(moderate: number, vigorous: number=0) {
    if (isNaN(moderate) || isNaN(vigorous)) {
      throw new Error(`Cannot create ExperiencePoints, EXP is NaN [moderate: ${moderate} vigorous: ${vigorous}]`);
    }

    return new ExperiencePoints(moderate, vigorous);
  }
}

const round = (val: number) => Math.floor(val*10)/10;