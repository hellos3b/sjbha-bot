import { assertDefined, just } from "../util";
import { ChatInputCommandInteraction, InteractionReplyOptions } from "discord.js";
import { formatDistance } from "date-fns";
import { World } from "../world";
import { interactionFailed, makeUnexpectedReply } from "../errors";

interface tldr {
   message: string;
   from: string;
   timestamp: Date;
   channelID: string;
   channel: string;
}

const collection_name = "tldrs";
const tldrs_count = 10;
const embed_color = 11393254;

const makeSavedReply = (tldr: tldr): InteractionReplyOptions => ({
   embeds: [{
      color: embed_color,
      description: `💬 ${tldr.message}`
   }]
});

const save = (interaction: ChatInputCommandInteraction, world: World): void => {
   const message = interaction.options.getString ("note");
   assertDefined (message, "'note' is required");

   const tldr: tldr = {
      message,
      from: interaction.user.id,
      timestamp: new Date (),
      channelID: interaction.channelId,
      channel: (interaction.channel && "name" in interaction.channel)
         ? interaction.channel.name
         : ""
   };

   const saved = world.mongodb
      .collection (collection_name)
      .insertOne (tldr)
      .then (just (tldr));

   saved
      .then (makeSavedReply)
      .catch (makeUnexpectedReply)
      .then (_ => interaction.reply (_), interactionFailed);
};

const makeListReply = (tldrs: tldr[], channelId: string, currentDate: Date): InteractionReplyOptions => ({
   embeds: [{
      title: "💬 TLDR",
      color: embed_color,  
      fields: tldrs.map (tldr => ({
         name: tldr.message,
         value: `*${formatDistance (currentDate, tldr.timestamp)} • ${tldr.from} • <#${tldr.channelID}>*`
      }))
   }],
   ephemeral: channelId !== process.env.CHANNEL_SHITPOST
});

const list = (interaction: ChatInputCommandInteraction, world: World): void => {
   const items = world.mongodb
      .collection (collection_name)
      .find ()
      .limit (tldrs_count)
      .toArray ();

   items
      .then (tldrs => makeListReply (tldrs, interaction.channelId, new Date ()))
      .catch (makeUnexpectedReply)
      .then (_ => interaction.reply (_), interactionFailed);
};

export const routeSubCommand = (interaction: ChatInputCommandInteraction, world: World): void => {
   switch (interaction.options.getSubcommand ()) {
      case "list":
         list (interaction, world);
         break;

      case "save":
         save (interaction, world);
         break;

      default:
         throw new Error (`Unrecognized sub command '${interaction.options.getSubcommand ()}'`);
   }
};