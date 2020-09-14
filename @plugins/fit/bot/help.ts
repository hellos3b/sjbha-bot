import {Request} from "@services/bastion";
import {basePath} from "@plugins/fit/config";


//
// Provide a list of the available commands
//
export async function help(req: Request) {
  const HELP_URL = basePath + "/fit/help";

  req.reply(`
How it works: <${HELP_URL}>

\`\`\`
!fit auth        • Connect your strava account to the bot
!fit profile     • View your profile stats like level, fit score, activity overview
!fit exp         • Check your EXP for this week
!fit leaderboard • View all users by fit score
\`\`\`
`);
}
