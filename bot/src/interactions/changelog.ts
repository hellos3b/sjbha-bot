import { exec } from "child_process";
import * as D from "discord.js";
import * as Interaction from "../interaction";

const get = () => new Promise<string> ((resolve, reject) => {   
   exec ("git log --pretty=format:\"%s\" -5", (error, stdout) => {
      if (error)
         return void reject (error);
      resolve (stdout);
   });
});

export const getLogEmbed = async (): Promise<D.APIEmbed> => {
   const log = await get ();
   return {
      title: "Changelog",
      description: log
         .split ("\n")
         .map (entry => "* " + entry)
         .join ("\n"),
      footer: {
         text: "https://github.com/hellos3b/sjbha-bot",
      }
   };
};

export const changelog = Interaction.make ({
   config: [{
      name: "changelog",
      description: "get a list of recent bot updates",
      type: Interaction.commandType.slash
   }],

   handle: async (interaction) => {
      try {
         const embed = await getLogEmbed ();
         interaction.reply ({ embeds: [embed] });
      }
      catch (e) {
         // eslint-disable-next-line no-console
         console.error (e);
      }
   }
});
