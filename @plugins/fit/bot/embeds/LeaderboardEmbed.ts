import {map} from "lodash";
import {MessageEmbed} from "discord.js";

import { SerializedUser } from "../../domain/user/User";

interface LeaderboardData {
  nicknames: Record<string, string>;
  users: SerializedUser[];
}

export default function LeaderboardEmbed({nicknames, users}: LeaderboardData) {
  const embed = new MessageEmbed().setColor("#4ba7d1");

  embed.setAuthor("Fit Score Leaderboard", "https://imgur.com/Wj9X4s0.png");
  // embed.setTitle("Fit score leaderboard");

  let leaderboard = map(
    users,
    (user, i) => {
      const nickname = nicknames[user.discordId];
      const rank = (i + 1).toString().padStart(2, "0");
      return `${rank}.   **${nickname}** • ${Math.floor(user.fitScore)}`; 
    }
  ).join("\n");

  embed.setDescription(leaderboard);

  return embed;
}