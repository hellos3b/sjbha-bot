import Debug from "debug";

import {Request} from "@services/bastion";
import {basePath} from "@plugins/fit/config";


const debug = Debug("c/fit:bot-controller");

//
// Provide a list of the available commands
//
export async function help(req: Request) {
  const HELP_URL = basePath + "/help";

  // todo: move how it works to an actual web page?
  req.reply(`
**!fit auth** • Connect your strava account to the bot
**!fit profile** • View your profile stats like level, fit score, activity overview
**!fit leaderboard** • View all users by fit score

How it works: <${HELP_URL}>
`);
}
