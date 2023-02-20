import * as dotenv from "dotenv";
dotenv.config ();

import { Settings } from "luxon";
import * as Discord from "discord.js";
import Hapi from "@hapi/hapi";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { MongoClient } from "mongodb";

import { env } from "./environment";
import { type World } from "./world";
import { logger } from "./logger";
import { just, tap } from "./prelude";

// legacy commands
import * as Legacy from "./deprecating/legacy_instance";
import { subscribe } from "./commands/subscribe/Subscribe";
import { throw_rps } from "./commands/throw/Throw";
import * as Meetup from "./commands/meetup/RegisterMeetup";
import * as Fit from "./commands/fit/Fit";

// slash commands
import { aqi } from "./interactions/aqi";
import { christmas } from "./interactions/christmas";
import { define } from "./interactions/define";
import { pong } from "./interactions/pong";
import { tldr } from "./interactions/tldr";
import { version } from "./interactions/version";
import { mod } from "./interactions/mod";
import { interaction } from "./interaction";

const log = logger ("main");

const interactions: interaction[] = [
   aqi,
   christmas,
   define,
   pong,
   tldr,
   version,
   mod
];

const legacy_message_commands = [
   subscribe,
   throw_rps,
   Meetup.command,
   Fit.command
];

const registerSlashCommands = async() => {
   const { DISCORD_TOKEN, DISCORD_CLIENT_ID, SERVER_ID } = env;

   const rest = new REST ({ version: "9" }).setToken (DISCORD_TOKEN);

   return rest.put (
      Routes.applicationGuildCommands (DISCORD_CLIENT_ID, SERVER_ID),
      { body: interactions.flatMap (it => it.config) }
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
   const token = env.DISCORD_TOKEN;
   const client = makeDiscordClient ();
   const discord = new Promise<Discord.Client> ((resolve, reject) => {
      client.on ("ready", () => resolve (client));
      client.login (token)
         .then (tap (_ => { log.info ("Logged in", { tag: client.user?.tag, version: process.env.npm_package_version ?? "" }); }))
         .catch (reject);
   });

   const mongodb = MongoClient
      .connect (env.MONGO_URL, { useUnifiedTopology: true })
      .then (tap (_ => { log.info ("MongoDB is connected"); }));

   const hapiServer = Hapi.server ({
      port:   env.HTTP_PORT,
      host:   "0.0.0.0",
      routes: { cors: true }
   });

   const hapi = hapiServer
      .start ()
      .then (just (hapiServer))
      .then (tap (_ => { log.info ("Hapi has started", { port: env.HTTP_PORT }); })); 

   return Promise
      .all ([discord, mongodb, hapi])
      .then (([discord, mongodb, hapi]): World => ({ 
         discord, 
         mongodb: mongodb.db (),
         hapi 
      }));
};

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
   const handlers = interactions
      .filter (it => it.config.some (c => c.name === interaction.commandName))
      .map (it => it.handle);

   handlers.forEach (f => f (interaction, world));
};

void async function main() {
   Settings.defaultZoneName = "America/Los_Angeles"; 

   registerSlashCommands ();
   const world = await createWorld ();

   world.hapi.route ([
      ...Meetup.routes,
      ...Fit.routes (world.discord)
   ]);
   
   // legacy initialization
   Legacy.initialize (world);
   Meetup.startup (world.discord);
   Fit.startup (world.discord);

   world.discord.on (Discord.Events.MessageCreate, message => { 
      if (!message.author.bot) handleMessage (message); 
   });

   world.discord.on (Discord.Events.InteractionCreate, interaction => {
      if (interaction.isChatInputCommand ()) handleCommandInteraction (interaction, world);
   });

   if (env.NODE_ENV === "production") {
      const admin = await world.discord.channels.fetch (env.CHANNEL_BOT_ADMIN);

      if (admin?.isTextBased ()) {
         admin.send (`Boredbot Online v${process.env.npm_package_version}`);
      }
   }
} ();

