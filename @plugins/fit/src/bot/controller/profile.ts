import {Request} from "@services/bastion";
import {debug} from "@plugins/fit/config";

import {getUser} from "../../domain/user/UserRepository";
import {getActivitySummary} from "../../domain/strava/ActivitySummaryRepository";

import ProfileEmbed from "../embeds/ProfileEmbed";

// 
// Display an over view of stats 
//
export async function profile(req: Request) {
  const message = await req.reply("*Loading*");

  const [user, summary] = await Promise.all([
    getUser(req.author.id),
    getActivitySummary(req.author.id)
  ]);

  const embed = ProfileEmbed({
    member    : req.getMember(),
    user      : user.getProfile(),
    activities: summary.getDetails()
  });

  message.delete();
  await req.reply(embed);
}