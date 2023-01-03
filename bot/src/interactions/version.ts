import { interactionFailed } from "../errors";
import * as Interaction from "../interaction";

export const version = Interaction.make ({
   config: [{
      name: "version",
      description: "Get the current running version for BoredBot",
      type: Interaction.commandType.slash
   }],

   handle: interaction => 
      interaction
         .reply (process.env.npm_package_version ?? "Unable to fetch package version")
         .catch (interactionFailed)
});