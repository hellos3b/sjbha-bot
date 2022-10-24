import { interactionFailed } from "../errors";
import { CommandInteraction } from "discord.js";

export const reply = (interaction: CommandInteraction): void => {
   interaction
      .reply (process.env.npm_package_version)
      .catch (interactionFailed);
};