import * as dotenv from "dotenv";
dotenv.config ();

import { Settings } from "luxon";
import * as Discord from "discord.js";
import Hapi from "@hapi/hapi";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

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
import { changelog, getLogEmbed } from "./interactions/changelog";
import { christmas } from "./interactions/christmas";
import { define } from "./interactions/define";
// import { pong } from "./interactions/pong";
import * as Pong from "./interactions/Pong.bs";
import * as sanjose from "./interactions/reddit-sanjose";
import { tldr } from "./interactions/tldr";
import { version } from "./interactions/version";
import { mod } from "./interactions/mod";
import { interaction } from "./interaction";

const log = logger ("main");

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

const createMongoClient = () => 
   MongoClient
      .connect (env.MONGO_URL, { useUnifiedTopology: true })
      .then (tap (_ => { log.info ("MongoDB is connected"); }))
      .then (m => m.db ());

const createDiscordClient = () => 
   new Promise<Discord.Client> ((resolve, reject) => {
      const token = env.DISCORD_TOKEN;
      const client = makeDiscordClient ();
      
      client.on ("ready", () => resolve (client));
      client.login (token)
         .then (tap (_ => { log.info ("Logged in", { tag: client.user?.tag, version: process.env.npm_package_version ?? "" }); }))
         .catch (reject);
   });

const createHapiServer = async () => {
   const hapiServer = Hapi.server ({
      port:   env.HTTP_PORT,
      host:   "0.0.0.0",
      routes: { cors: true }
   });

   await hapiServer
      .start ()
      .then (tap (_ => { log.info ("Hapi has started", { port: env.HTTP_PORT }); })); 

   return hapiServer;
};

const legacy_message_commands = [
   subscribe,
   throw_rps,
   Meetup.command,
   Fit.command
];

const registerSlashCommands = async(interactions: interaction[]) => {
   const { DISCORD_TOKEN, DISCORD_CLIENT_ID, SERVER_ID } = env;
   const rest = new REST ({ version: "9" }).setToken (DISCORD_TOKEN);
   return rest.put (
      Routes.applicationGuildCommands (DISCORD_CLIENT_ID, SERVER_ID),
      { body: interactions.flatMap (it => it.config) }
   ).then (_ => { log.debug ("Slash Commands Registered"); });
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

const matchesCommand = (commandName: string) => (interaction: interaction) => {
   const listeners = Array.isArray (interaction.config)
      ? interaction.config.map (x => x.name)
      : [interaction.config.name];
   return listeners.some (c => c === commandName);
};
   
const handleCommandInteraction =
   (interactions: interaction[]) =>
      (interaction: Discord.ChatInputCommandInteraction, world: World) => 
         interactions
            .filter (matchesCommand (interaction.commandName))
            .forEach (it => it.handle (interaction, world));

// error handling

const error_log_file = path.join (__dirname, "..", "error.log");

process
   .on ("unhandledRejection", (reason, p) => {
      // eslint-disable-next-line no-console
      console.log (reason, "Unhandled rejection at promise", p);
   })
   .on ("uncaughtException", (err) => {
      // eslint-disable-next-line no-console
      console.error (err, "uncaught exception thrown");
      const message = (err instanceof Error && err.stack) ? err.stack : "Unknown";
      fs.writeFileSync (error_log_file, message, "utf8");
      process.exit (1);
   });

void async function main() {
   Settings.defaultZoneName = "America/Los_Angeles"; 

   const [discord, mongodb, hapi] = await Promise
      .all ([createDiscordClient (), createMongoClient (), createHapiServer ()]);

   const interactions: interaction[] = [
      aqi,
      changelog,
      christmas,
      define,
      Pong.make (),
      tldr,
      version,
      mod
   ];

   registerSlashCommands (interactions);

   hapi.route ([
      ...Meetup.routes,
      ...Fit.routes (discord),
      sanjose.webhook (discord)
   ]);
   
   // legacy initialization
   Legacy.initialize ({ discord, hapi, mongodb });
   Meetup.startup (discord);
   Fit.startup (discord);

   discord.on (Discord.Events.MessageCreate, message => { 
      if (!message.author.bot) handleMessage (message); 
   });

   const handle = handleCommandInteraction (interactions);
   discord.on (Discord.Events.InteractionCreate, interaction => {
      if (interaction.isChatInputCommand ()) handle (interaction, { discord, hapi, mongodb });
   });

   if (env.NODE_ENV === "production") {
      const admin = await discord.channels.fetch (env.CHANNEL_BOT_ADMIN);

      if (admin?.isTextBased ()) {
         const changelog = await getLogEmbed ();

         admin.send ({
            content: "<:bankbot:613855784996044826> Boredbot Online",
            embeds: [changelog]
         });
      }
   }

} ();

