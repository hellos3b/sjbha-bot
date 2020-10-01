import {Request} from "@services/bastion";
import * as User from "../../models/user";
import {getUser} from "../../domain/user/UserRepository";
import {getActivitySummary} from "../../domain/strava/ActivitySummaryRepository";

import {createProfileEmbed} from "./embeds/ProfileEmbed";

// 
// Display an over view of stats 
//
export async function profile(req: Request) {
  const message = await req.reply("One second, let me get that for you");

  const [user, summary] = await Promise.all([
    getUser(req.author.id),
    getActivitySummary(req.author.id)
  ]);

  const embed = createProfileEmbed({
    member    : req.getMember(),
    user      : user.getProfile(),
    activities: summary.getDetails()
  });

  message.delete();

  console.log(embed);
  
  await req.reply({embed});
}