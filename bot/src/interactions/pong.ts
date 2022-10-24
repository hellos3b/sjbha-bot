import { interactionFailed } from "../errors";
import { CommandInteraction } from "discord.js";

export const reply = (interaction: CommandInteraction): void => {
   interaction
      .reply ("Ping?")
      .catch (interactionFailed);
};