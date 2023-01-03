import * as Discord from "discord.js";
import * as Streak from "./Streak";
import { MemberList } from "../../deprecating/MemberList";

export async function leaderboard(message: Discord.Message) : Promise<void> {
   const streaks = (await Streak.fetchAll ())
      .sort ((a, b) => a.bestStreak > b.bestStreak ? -1 : 1);

   const members = await MemberList.fetch (message.client, streaks.map (s => s.userId));

   let table = "```";

   for (const { userId, bestStreak } of streaks) {
      table += bestStreak.toString ().padEnd (3, " ");
      table += members.get (userId)
         .map (m => m.displayName)
         .getOrElseValue ("Someone");
      table += "\n";
   }

   table += "```";
   message.channel.send (table);
} 