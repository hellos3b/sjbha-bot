import { Settings } from "luxon";
import Hapi from "@hapi/hapi";

import { channels } from "./server";
import { DiscordClient, env, MongoDb, Log } from "./app";
import * as Command from "./Command";
import * as Fit from "./commands/fit/Fit";
import * as Meetup from "./commands/meetup/RegisterMeetup";
import * as RPS from "./commands/throw/Throw";
import * as Subscribe from "./commands/subscribe/Subscribe";
import * as CommandsNowSlashed from "./CommandsNowSlashed";

import * as Manifest from "./Manifest";
import * as MainRescript from "./MainRescript.bs";
import { ChannelType } from "discord.js";

Settings.defaultZoneName = "America/Los_Angeles";
const log = Log.make ("main");

const commands = Command.combine (
   Fit.command,
   Meetup.command,
   RPS.command,
   Subscribe.subscribe,
   CommandsNowSlashed.warn
);

const routes = [
   ...Fit.routes,
   ...Meetup.routes
];

const onStartup = [
   Fit.startup,
   Meetup.startup
];

void async function main() {
   log.info ("Starting app");

   const webServer =
    Hapi.server ({
       port:   env.HTTP_PORT,
       host:   "0.0.0.0",
       routes: { cors: true }
    });

   webServer
      .start ()
      .then (_ => log.info ("Webserver running"));

   webServer.route (routes);

   MongoDb
      .connect (env.MONGO_URL)
      .then (_ => log.info ("Connected to MongoDb"))
      .catch (_ => { log.error ("MongoDB failed to connect, some commands may not work.\n(Make sure the db is running with 'npm run db') "); });


   const slashCommands = await Manifest.createSlashCommands ();

   DiscordClient.connect ({
      token: env.DISCORD_TOKEN,

      onReady: async client => {
         log.info ("Bastion connected", { tag: client.user?.tag, version: env.VERSION });

         if (env.IS_PRODUCTION) {
            const channel = await client.channels.fetch (channels.bot_admin);
            channel?.type === ChannelType.GuildText && channel.send (`🤖 BoredBot Online! v${env.VERSION}`);
         }

         onStartup.forEach (loader => loader (client));
      },

      onMessage: message => {
         MainRescript.run (message);
         commands (message);
      },

      onReaction: _ => _,

      onCommand: interaction => {
         const command = slashCommands.get (interaction.commandName);
         if (command) command (interaction);
      }
   });

   Manifest.createSlashCommands ();
} ();
