import ExperiencePoints from "../user/ExperiencePoints";
import { ExpSchema } from "../../db/ExpCollection";

export default class WorkoutLog {
  public readonly discordId: string;
  public readonly activityId: string;
  public readonly exp: ExperiencePoints;

  private constructor(discordId: string, activityId: string, exp: ExperiencePoints) {
    this.discordId = discordId;
    this.activityId = activityId;
    this.exp = exp;
  }

  public static createFromDb(data: ExpSchema) {
    const exp = ExperiencePoints.createFromDb(data);
    return new WorkoutLog(data.discordId, data.activityId, exp)
  }

  public static create(discordId: string, activityId: string, exp: ExperiencePoints) {
    return new WorkoutLog(discordId, activityId, exp);
  }
}