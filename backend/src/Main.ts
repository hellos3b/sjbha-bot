import 'dotenv/config';
import moduleAlias from 'module-alias';
moduleAlias.addAlias ('@sjbha', __dirname);

import { Settings } from 'luxon';
import Hapi from '@hapi/hapi';
import chalk from 'chalk';
import { channels } from './server';
import { DiscordClient, env, MongoDb } from './app';
import * as Command from './utils/Command';

import * as Aqi from './commands/aqi/aqi';
import * as Christmas from './commands/christmas/Christmas';
import * as Fit from './commands/fit/Fit';
import * as Meetup from './commands/meetup/register';
import * as Pong from './commands/pong/Pong';
import * as RPS from './commands/throw/Throw';
import * as Subscribe from './commands/subscribe/Subscribe';
import * as Version from './commands/version/Version';

Settings.defaultZoneName = 'America/Los_Angeles';

const commands = Command.combine (
  Aqi.command,
  Christmas.command,
  Fit.command,
  Meetup.command,
  Pong.command,
  RPS.command,
  Subscribe.command,
  Version.command
);

const routes = [
  ...Fit.routes,
  ...Meetup.routes
];

const onStartup = [
  Fit.startup,
  Meetup.startup
];

const success = chalk.green ('✓');
const failed = chalk.red ('X');

const start = () => {
  console.log (chalk.gray ('Starting App...'));

  const webServer = 
    Hapi.server ({
      port:   env.HTTP_PORT,
      host:   '0.0.0.0',
      routes: { cors: true }
    });
    
  webServer
    .start ()
    .then (_ => console.log (success, 'Webserver running'));

  webServer.route (routes);

  MongoDb
    .connect (env.MONGO_URL)
    .then (_ => console.log (success, 'Connected to MongoDb'))
    .catch (_ => { console.warn (failed, 'MongoDB failed to connect, some commands may not work.\n(Make sure the db is running with \'npm run db\') ', env.MONGO_URL) });

  DiscordClient.connect ({
    token: env.DISCORD_TOKEN,

    onReady: async client => {
      console.log (success, `Bastion connected as '${client.user?.tag}' v${env.VERSION}`);

      if (env.IS_PRODUCTION) {
        const channel = await client.channels.fetch (channels.bot_admin);
        channel?.isText () && channel.send (`🤖 BoredBot Online! v${env.VERSION}`);
      }

      onStartup.forEach (loader => loader (client));
    },

    onMessage: commands,

    onReaction: _ => _
  });
}

// GO!
start ();