import _ from "lodash";
import {MessageEmbed} from "discord.js";

import { ProgressReport, Promotion, LeaderboardEntry, PromotionType } from "../../../domain/exp/WeeklyProgress";
import format from "string-format";

interface WeeklyProps {
  userNameMap: Record<string, string>;
  report: ProgressReport;
}


export function createProgress({userNameMap, report}: WeeklyProps) {
  const nickname = (id: string) => userNameMap[id] || "Unknown";
  const toEntry = (p: Promotion) => toListItem(p.points, p.exp, nickname(p.discordId), p.newScore);

  const pos = report.promotions
    .filter(i => i.points > 0)
    .sort((a, b) => a.newScore > b.newScore ? -1 : 1)

  const neg = report.promotions
    .filter(i => i.points < 0)
    .sort( (a, b) => a.points > b.points ? -1 : 1)

  const lists: string[] = [];
  
  if (pos.length) {
    lists.push(`Goal:\n` + pos.map(toEntry).join("\n"))
  }

  if (neg.length) {
    lists.push(`Miss:\n` +neg.map(toEntry).join("\n"))
  }

  return format("Progress: ```diff\n{0}```", lists.join("\n\n"));
}

const toListItem = (gained: number, exp: number, nickname: string, total: number) =>
  format('{0}  {1} ({2})', formatPts(gained), nickname, total.toFixed(1));

const formatPts = (pts: number) => pts > 0 
  ? '+' + pts.toFixed(1)
  : '-' + Math.abs(pts).toFixed(1)