import { Settings } from "luxon";
import * as Discord from "discord.js";
import Hapi from "@hapi/hapi";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { MongoClient } from "mongodb";

import * as environment from "./environment";
import { type World } from "./common/world";
import { logger } from "./logger";
import { just, tap } from "./common/util_fn";
import { interactionConfig, commandType, optionType, permissions } from "./command_config";

// legacy commands
import * as legacy from "./legacy_instance";
import { subscribe } from "./commands/subscribe/Subscribe";
import { throw_rps } from "./commands/throw/Throw";
import * as meetup from "./commands/meetup/RegisterMeetup";

// slash commands
import { aqi } from "./interactions/aqi";
import { christmas } from "./interactions/christmas";
import { define } from "./interactions/define";
import { pong } from "./interactions/pong";
import { tldr } from "./interactions/tldr";
import { version } from "./interactions/version";
import { mod } from "./interactions/mod";

const log = logger ("main");

const interactions = (): interactionConfig[] => [
   {
      name: "aqi",
      description: "Show the current AQI reading from over the south bay",
      type: commandType.slash
   },

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
      name: "mod",
      description: "Commands meant to help make modding easier",
      type: commandType.slash,
      default_member_permissions: permissions.kick,
      options: [
         {
            type: optionType.sub_command,
            name: "log",
            description: "Log a note about a specific user",
            options: [{
               type: optionType.user,
               name: "user",
               description: "The user this note is about",
               required: true
            }, {
               type: optionType.string,
               name: "note",
               description: "The note you want to save for this user",
               required: true
            }]
         },

         {
            type: optionType.sub_command,
            name: "echo",
            description: "Play simon says with bored bot (hey, dont abuse this!)",
            options: [{
               type: optionType.string,
               name: "text",
               description: "The text that bored bot will repeat",
               required: true
            }]
         },

         {
            type: optionType.sub_command,
            name: "lookup",
            description: "Look up notes that have been saved for a user",
            options: [{
               type: optionType.user,
               name: "user",
               description: "The user to lookup",
               required: true
            }]
         }
      ]
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

   const hapiServer = Hapi.server ({
      port:   process.env.HTTP_PORT,
      host:   "0.0.0.0",
      routes: { cors: true }
   });

   hapiServer.route ([
      ...meetup.routes
   ]);

   const hapi = hapiServer
      .start ()
      .then (just (hapiServer))
      .then (tap (_ => { log.info ("Hapi has started", { port: process.env.HTTP_PORT }); })); 

   return Promise
      .all ([discord, mongodb, hapi])
      .then (([discord, mongodb, hapi]): World => ({ 
         discord, 
         mongodb: mongodb.db (),
         hapi 
      }));
};

const legacy_message_commands = [
   subscribe,
   throw_rps,
   meetup.command
];

const handleMessage = (message: Discord.Message) => {
   const [command] = message.content.split (" ");
   switch (command) {
      case "!aqi":
      case "!christmas":
      case "!define":
      case "!pong":
      case "!tldr":
      case "!version":
         message.reply (`The ${command} command has been turned into a slash command, check it out by using /${command.slice (1)}`);
         break;

      default:
         legacy_message_commands.forEach (f => f (message));
   }
};

const handleCommandInteraction = (interaction: Discord.ChatInputCommandInteraction, world: World) => {
   switch (interaction.commandName) {
      case "aqi":
         aqi (interaction);
         break;

      case "christmas":
         christmas (interaction);
         break;

      case "define":
         define (interaction);
         break;

      case "mod":
         mod (interaction, world);
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

      default:
         log.error (`Missing interaction case '${interaction.commandName}'`);
   }
};

void async function main() {
   Settings.defaultZoneName = "America/Los_Angeles";
   environment.assertValid ();

   registerSlashCommands ();
   const world = await createWorld ();
   
   // legacy initialization
   legacy.initialize (world);
   meetup.startup (world.discord);

   world.discord.on (Discord.Events.MessageCreate, message => { 
      if (!message.author.bot) handleMessage (message); 
   });

   world.discord.on (Discord.Events.InteractionCreate, interaction => {
      if (interaction.isChatInputCommand ()) handleCommandInteraction (interaction, world);
   });
} ();

