import {reduce} from "lodash";
import {Request} from "@services/bastion";
// import {debug} from "@plugins/fit/config";
import LeaderboardEmbed from "../embeds/LeaderboardEmbed";
import {getAllUsers} from "../../domain/user/UserRepository";

export async function leaderboard(req: Request) {
  const users = await getAllUsers();

  const leaderboard = users.getFitscoreLeaderboard();

  if (leaderboard.length === 0) {
    await req.reply("Nobody has a fit score :(")
    return;
  }

  const nicknames = reduce(
    leaderboard,
    (map, user) => {
      const member = req.getMember(user.discordId);
      map[user.discordId] = member.member.displayName;
      return map;
    },
    {} as Record<string, string>
  )

  const embed = LeaderboardEmbed({
    users: leaderboard,
    nicknames
  });

  await req.reply(embed);
}