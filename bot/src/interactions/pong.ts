import { interactionFailed } from "../errors";
import * as Interaction from "../interaction";

export const pong = Interaction.make ({
   config: [{
      name: "pong",
      description: "Check if the v2 bot is alive",
      type: Interaction.commandType.slash
   }],

   handle: interaction =>
      interaction
         .reply ("Ping?")
         .catch (interactionFailed)
});