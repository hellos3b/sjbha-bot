import * as DiscordJs from "discord.js";

export const cmdPong = (message: DiscordJs.Message): void => {
  message.reply("Ping??");
}