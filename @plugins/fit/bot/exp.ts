import {Request} from "@services/bastion";
import { getCurrentLogsForUser } from "../domain/exp/WorkoutLogRepository";
import {weekly_exp_goal} from "../config";

//
// Provide a list of the available commands
//
export async function exp(req: Request) {
  const progress = await getCurrentLogsForUser(req.author.id);

  req.reply(`Weekly EXP: ${progress.totalExp}/${weekly_exp_goal}`);
}
