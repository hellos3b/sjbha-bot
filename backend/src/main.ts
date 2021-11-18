import 'dotenv/config';

import moduleAlias from 'module-alias';
moduleAlias.addAlias ('@sjbha', __dirname);

// Default time zone
import { Settings } from 'luxon';

Settings.defaultZoneName = 
  'America/Los_Angeles';

import Hapi from '@hapi/hapi';
import chalk from 'chalk';

import { channels } from './config';
import { DiscordClient, env, MongoDb } from './app';
import * as Commands from './Commands';
import * as Router from './Router';
import * as Startup from './Startup';

const success = chalk.green ('✓');
const failed = chalk.red ('X');

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

webServer.route (Router.routes);

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

    Startup.loaders.forEach (loader => loader (client));

  },

  onMessage: message => Commands.run (message),

  onReaction: _ => _
});