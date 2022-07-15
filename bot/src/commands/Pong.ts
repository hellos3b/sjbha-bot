import { Command } from "@sjbha/common/SlashCommand";

export default Command.make({
  name: "pong",
  description: "Hello? Is the bot alive?",
  async execute(interaction) {
    interaction.reply("Ping?")
  }
});