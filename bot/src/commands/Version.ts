import { Command } from "@sjbha/common/SlashCommand";

export default Command.make({
  name: "version",
  description: "Check which version the bot is currently running",
  async execute(interaction) {
    interaction.reply(`BoredBot v${process.env.npm_package_version}`);
  }
});