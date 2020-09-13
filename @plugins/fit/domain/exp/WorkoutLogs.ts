import {reduce, chain} from "lodash";
import { ExpSchema } from "../../db/ExpCollection";
import WorkoutLog from "./WorkoutLog";

export default class WorkoutLogs {
  private readonly workouts: WorkoutLog[];

  private constructor(workouts: WorkoutLog[]) {
    this.workouts = workouts;
  }

  get count() {
    return this.workouts.length;
  }

  get totalExp() {
    return reduce(
      this.workouts,
      (sum, workout) => sum + workout.exp.total, 
      0
    );
  }

  public getWorkoutsFor(discordId: string) {
    return chain(this.workouts)
      .filter(w => w.discordId === discordId)
      .thru(WorkoutLogs.createFromList)
      .value();
  }

  public getBiggestWorkout() {
    return chain(this.workouts)
      .sortBy([w => w.exp.total])
      .last()
      .value();
  }

  public static createFromDb(results: ExpSchema[]) {
    const workouts = results.map(WorkoutLog.createFromDb);
    return new WorkoutLogs(workouts);
  }

  public static createFromList(workouts: WorkoutLog[]) {
    return new WorkoutLogs(workouts);
  }
}