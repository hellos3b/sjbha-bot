import _ from "lodash";
import {MessageEmbed} from "discord.js";

import { ProgressReport, Promotion, LeaderboardEntry, PromotionType } from "../../domain/exp/WeeklyProgress";
import Week from "../../domain/exp/Week";
import Rank from "../../domain/user/Rank";

interface WeeklyProps {
  week: Week;
  // Indexed by ID
  userNameMap: Record<string, string>;
  report: ProgressReport;
  biggestActivity?: {
    discordId: string;
    title: string;
    exp: number
  };
}

const STRAVA_ICON = "https://imgur.com/7EEpy4h.png";
const SAD_DOGE_IMG = "https://imgur.com/B01QjOp.png";
const SWOLE_DOGE_IMG = "https://imgur.com/lUCIFkk.png";


export function createWeeklyEmbed({week, userNameMap, report, biggestActivity}: WeeklyProps) {
  const embed = new MessageEmbed().setColor("FC4C02");

  const weekStart = week.start.toFormat("MM/dd");
  const weekEnd = week.end.toFormat("MM/dd");

  const leaders = formatLeaderboard(report.leaderboard, userNameMap);
  const promotions = formatPromotions(report.promotions, userNameMap);

  embed.setAuthor("Weekly Activity Report", STRAVA_ICON);

  if (report.activityCount === 0) {
    embed.setThumbnail(SAD_DOGE_IMG);
    embed.setDescription(`No activities were recorded between *${weekStart} - ${weekEnd}*. :(`)
  } else {
    embed.setThumbnail(SWOLE_DOGE_IMG);
    embed.setDescription(`**${report.users.length}** users recorded **${report.activityCount}** activities between *${weekStart} - ${weekEnd}*`)
    embed.addField(`EXP Leaders`, leaders);
  }

  if (biggestActivity) {
    const biggestNickname = userNameMap[biggestActivity.discordId];
    embed.addField(
      `Biggest Activity`,
      `${biggestActivity.title} • *${biggestNickname}, ${biggestActivity.exp.toFixed(1)} exp*`
    )
  }

  if (!!promotions) {
    embed.addField("Promotions", promotions);
  }

  return embed;
}

const formatPromotions = (promotions: Promotion[], nicknames: Record<string, string>) => _.chain(promotions)
  .filter(p => p.type !== PromotionType.SAME)
  .map(promo => {
    const nickname = nicknames[promo.discordId];
    const grammar = promo.type === PromotionType.PROMOTED ? ({ arrow: '⭐ ↑', verb: 'promoted' }) : ({ arrow: '🥔 ↓', verb: 'demoted' })
    const rankNumber = promo.rank.rank === Rank.maxRank ? `max rank` : `rank ${promo.rank.rank}`;

    return `${grammar.arrow} **${nickname}** ${grammar.verb} to **${promo.rank.name}** (${rankNumber})`;
  })
  .join("\n")
  .value();

const formatLeaderboard = (leaderboard: LeaderboardEntry[], nicknames: Record<string, string>) => _.chain(leaderboard)
    .slice(0, 3)
    .map((n, i) => {
      const nickname = nicknames[n.discordId];
      return `${i+1}. **${nickname}** • ${n.exp.toFixed(1)} exp`
    })
    .join("\n")
    .value();