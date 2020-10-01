import {Request} from "@services/bastion";
import {basePath} from "@plugins/fit/config";

export const helpMsg = (helpLink: string) => `
How it works: <${helpLink}>

\`\`\`
!fit auth        • Connect your strava account to the bot
!fit profile     • View your profile stats like level, fit score, activity overview
!fit exp         • Check your EXP for this week
!fit leaderboard • View all users by fit score
\`\`\`
`;

//
// Provide a list of the available commands
//
export const help = (req: Request) => {
  const msg = helpMsg(basePath + "/fit/help");
  req.reply(msg);
}
