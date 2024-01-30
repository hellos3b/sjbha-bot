import { Message, EmbedBuilder } from "discord.js";
import { DateTime, Interval } from "luxon";
import fromNow from "fromnow";
import { option } from "ts-option";

import * as User from "./User";
import * as Workout from "./Workout";
import * as Week from "./Week";
import * as Rank from "./Rank";
import * as EmojiSet from "./EmojiSet";
import * as Format from "./Format";

export const render = async (message: Message) : Promise<void> => {
   const user = await User.findOne ({ discordId: message.author.id });

   if (!User.isAuthorized (user)) {
      message.reply ("You aren't set up with the Strava bot");
      return;
   }

   const member = option (message.member);

   const username = member.map (m => m.displayName).getOrElse (() => message.author.username);
   const displayColor = member.map (m => m.displayColor).getOrElse (() => 0xcccccc);

   const embed = new EmbedBuilder ();
   embed.setColor (displayColor);
   embed.setAuthor ({
      name:    username, 
      iconURL: message.author.displayAvatarURL ()
   });

   // User's current rank name
   const rank = Rank.fromScore (user.fitScore);
   const score = Math.floor (user.fitScore);
   embed.addFields ([
      { name: "Rank", value: `${rank} (${score})`, inline: true },
      { name: "Total EXP", value: Format.exp (user.xp), inline: true }
   ]);

   message.channel.send ({ embeds: [embed] });
};