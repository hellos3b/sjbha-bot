import * as Discord from "discord.js";
import * as Mongo from "mongodb";
import * as Hapi from "@hapi/hapi";

export interface World {
   discord: Discord.Client;
   mongodb: Mongo.Db;
   hapi: Hapi.Server;
}

export const broadcast = async(
   world: World, 
   channelId: string, 
   payload: Discord.MessageOptions
): Promise<Discord.Message> => {
   const channel = world.discord.channels.fetch (channelId);
   const textChannel = channel.then (it => 
      (it?.isTextBased ()) ? it : Promise.reject (new Error ("Not a text channel"))
   );

   return textChannel.then (channel => channel.send (payload));
};