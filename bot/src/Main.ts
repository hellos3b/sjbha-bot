import { Settings } from "luxon";
import * as Discord from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { MongoClient } from "mongodb";

import * as environment from "./environment";
import { type World } from "./world";
import { logger } from "./logger";
import { tap } from "./util";
import { interactionConfig, commandType, optionType } from "./command_config";

import { christmas } from "./interactions/christmas";
import { pong } from "./interactions/pong";
import { tldr } from "./interactions/tldr";
import { version } from "./interactions/version";
import { define } from "./interactions/define";

const log = logger ("main");

const interactions = (): interactionConfig[] => [
   {
      name: "christmas",
      description: "How many days are there left until christmas?",
      type: commandType.slash
   },

   {
      name: "define",
      description: "Look up the definition of a word, according to the all knowing urban dictionary",
      type: commandType.slash,
      options: [{
         type: optionType.string,
         name: "word",
         description: "The definition to look up",
         required: true
      }]
   },

   {
      name: "pong",
      description: "Check if the v2 bot is alive",
      type: commandType.slash
   },

   {
      name: "tldr",
      description: "Summarize things that happen on discord",
      type: commandType.slash,
      options: [
         {
            type: optionType.sub_command,
            name: "list",
            description: "Get a list of the most recent tldrs"
         },
         {
            type: optionType.sub_command,
            name: "save",
            description: "Save a new TLDR into discord history",
            options: [{ 
               type: optionType.string, 
               name: "note", 
               description: "What do you want to save?", 
               required: true
            }]
         }
      ]
   },

   {
      name: "version",
      description: "Get the current running version for BoredBot",
      type: commandType.slash
   }
];

const registerSlashCommands = async() => {
   const { DISCORD_TOKEN, DISCORD_CLIENT_ID, SERVER_ID } = process.env;

   const rest = new REST ({ version: "9" }).setToken (DISCORD_TOKEN);

   return rest.put (
      Routes.applicationGuildCommands (DISCORD_CLIENT_ID, SERVER_ID),
      { body: interactions () }
   ).then (_ => { log.debug ("Slash Commands Registered"); });
};

const makeDiscordClient = () => new Discord.Client ({
   intents: [
      Discord.GatewayIntentBits.Guilds,
      Discord.GatewayIntentBits.GuildMessages,
      Discord.GatewayIntentBits.GuildMessageReactions,
      Discord.GatewayIntentBits.GuildMembers,
      Discord.GatewayIntentBits.DirectMessages,
      Discord.GatewayIntentBits.MessageContent
   ],
   partials: [
      Discord.Partials.Message,
      Discord.Partials.Channel,
      Discord.Partials.Reaction
   ]
});

const createWorld = async(): Promise<World> => {
   const token = process.env.DISCORD_TOKEN;
   const client = makeDiscordClient ();
   const discord = new Promise<Discord.Client> ((resolve, reject) => {
      client.on ("ready", () => resolve (client));
      client.login (token)
         .then (tap (_ => { log.info ("Logged in", { tag: client.user?.tag, version: process.env.npm_package_version }); }))
         .catch (reject);
   });

   const mongodb = MongoClient
      .connect (process.env.MONGO_URL, { useUnifiedTopology: true })
      .then (tap (_ => { log.info ("MongoDB is connected"); }));

   return Promise
      .all ([discord, mongodb])
      .then (([discord, mongodb]): World => ({ discord, mongodb: mongodb.db () }));
};

const handleMessage = (message: Discord.Message) => {
   const [command] = message.content.split (" ");
   switch (command) {
      case "!christmas":
         message.reply ("The !define command has been turned into a slash command, check it out by using /christmas!");
         break;

      case "!define": 
         message.reply ("The !define command has been turned into a slash command, check it out by using /define!");
         break;

      case "!pong": 
         message.reply ("The !pong command has been turned into a slash command, check it out by using /pong!");
         break;

      case "!tldr": 
         message.reply ("The !tldr command has been turned into a slash command, check it out by using /tldr!");
         break;

      case "!version": 
         message.reply ("The !version command has been turned into a slash command, check it out by using /version!");
         break;
   }
};

const handleCommandInteraction = (interaction: Discord.ChatInputCommandInteraction, world: World) => {
   switch (interaction.commandName) {
      case "christmas":
         christmas (interaction);
         break;

      case "define":
         define (interaction);
         break;
         
      case "pong":
         pong (interaction);
         break;

      case "tldr":
         tldr (interaction, world);
         break;

      case "version":
         version (interaction);
         break;
   }
};

void async function main() {
   Settings.defaultZoneName = "America/Los_Angeles";
   environment.assertValid ();

   registerSlashCommands ();
   const world = await createWorld ();

   world.discord.on (Discord.Events.MessageCreate, message => { 
      if (!message.author.bot) handleMessage (message); 
   });

   world.discord.on (Discord.Events.InteractionCreate, interaction => {
      if (interaction.isChatInputCommand ()) handleCommandInteraction (interaction, world);
   });
} ();

