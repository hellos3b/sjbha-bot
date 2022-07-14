import * as DiscordJs from "discord.js";

export const cmdVersion = (message: DiscordJs.Message): void => {
  message.channel.send(`BoredBot v${process.env.npm_package_version}`);
}