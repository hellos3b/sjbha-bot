import * as Discord from "discord.js";
import * as Mongo from "mongodb";

export interface World {
   discord: Discord.Client;
   mongodb: Mongo.Db;
}