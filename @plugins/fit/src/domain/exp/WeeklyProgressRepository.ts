import ExpCollection from "../../db/ExpCollection";
import UserCollection from "../../db/UserCollection";

import Week from "./Week";
import WeeklyProgress from "./WeeklyProgress";
import { SerializedUser } from "../user/User";

export async function getProgressForWeek(week: Week) {
  const [users, workouts] = await Promise.all([
    UserCollection().find().toArray(),

    ExpCollection().find({
      week: week.id
    }).toArray()
  ]);

  return WeeklyProgress.createFromDb(users, workouts);
}


export async function saveProgress(progress: WeeklyProgress) {
  const users = progress.getSerializedUsers();
  await Promise.all(users.map(updateUser))
}

async function updateUser(user: SerializedUser) {
  return UserCollection()
    .updateOne(
      {discordId: user.discordId},
      {$set: {
        fitScore: user.fitScore
      }}
    );
}