import ExpCollection from "../../db/ExpCollection";
import WorkoutLog from "./WorkoutLog";
import WorkoutLogs from "./WorkoutLogs";
import Week from "./Week";

/** Get a user by their Discord ID */
export async function insertWorkout(workout: WorkoutLog) {
  await ExpCollection().insertOne({
    activityId  : workout.activityId,
    discordId   : workout.discordId,
    week        : Week.current().id,
    moderate    : workout.exp.moderate,
    vigorous    : workout.exp.vigorous
  });
}

export async function getCurrentLogsForUser(discordId: string) {
  const week = Week.current();

  const workouts = await ExpCollection()
    .find({week: week.id, discordId})
    .toArray()

  return WorkoutLogs.createFromDb(workouts);
}