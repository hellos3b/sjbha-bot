export { stravaWebhookHandler } from "./PostWorkout";
export { schedulePost } from "./MondayRecap";

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { createRecap } from "./MondayRecap";

export const fitSlashConfig = new SlashCommandBuilder()
   .setName("fit_admin")
   .setDescription("foo bar")
   .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
   .addSubcommand((cmd) =>
      cmd
         .setName("monday")
         .setDescription("Preview the fitness bot's monday post."),
   );

export const fitInteractionHandler = (db) => async (interaction) => {
   if ("fit_admin" === interaction.commandName) {
      const sub = interaction.options.getSubcommand();

      if ("monday" === sub) {
         const embed = await createRecap(interaction.client, db)();
         interaction.reply({
            content: "Here is a preview of the upcoming monday recap",
            embeds: [embed],
            ephemeral: true,
         });
      }
   }
};
