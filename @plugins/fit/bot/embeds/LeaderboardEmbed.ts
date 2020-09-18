import type {MessageOptions} from "discord.js";
import type { SerializedUser } from "../../domain/user/User";

import {inc} from "ramda";

interface LeaderboardData {
  nicknames: Record<string, string>;
  users: SerializedUser[];
}

export const createLeaderboardEmbed = ({nicknames, users}: LeaderboardData): MessageOptions["embed"] => ({
  color: 0x4ba7d1,

  author: {
    name: "Fit Score Leaderboard",
    icon_url: "https://imgur.com/Wj9X4s0.png"
  },

  description: users.map((user, i) => 
    row(inc(i), nicknames[user.discordId], Math.floor(user.fitScore))
  ).join("\n")
})

const row = (rank: number, name: string, fitScore: number) => 
  `${rank}. **${name}** • ${fitScore}`;