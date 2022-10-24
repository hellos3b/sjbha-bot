import { interactionFailed } from "../errors";
import { CommandInteraction } from "discord.js";

export const pong = (interaction: CommandInteraction): void => {
   interaction
      .reply ("Ping?")
      .catch (interactionFailed);
};