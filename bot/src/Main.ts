import 'dotenv/config';
import moduleAlias from 'module-alias';
moduleAlias.addAlias('@sjbha', __dirname);

import { Settings } from 'luxon';
import Hapi from '@hapi/hapi';
import { channels } from './server';
import { DiscordClient, env, MongoDb, Log } from './app';
import * as Command from './Command';
import * as Christmas from './commands/christmas/Christmas';
import * as Fit from './commands/fit/Fit';
import * as Meetup from './commands/meetup/RegisterMeetup';
import * as RPS from './commands/throw/Throw';
import * as Subscribe from './commands/subscribe/Subscribe';

import * as Commands from './Commands.bs';

Settings.defaultZoneName = 'America/Los_Angeles';
const log = Log.make('main');

const commands = Command.combine(
  Christmas.command,
  Fit.command,
  Meetup.command,
  RPS.command,
  Subscribe.command
);

const routes = [
  ...Fit.routes,
  ...Meetup.routes
];

const onStartup = [
  Fit.startup,
  Meetup.startup
];

const start = () => {
  log.info('Starting app');

  const webServer =
    Hapi.server({
      port: env.HTTP_PORT,
      host: '0.0.0.0',
      routes: { cors: true }
    });

  webServer
    .start()
    .then(_ => log.info('Webserver running'));

  webServer.route(routes);

  MongoDb
    .connect(env.MONGO_URL)
    .then(_ => log.info('Connected to MongoDb'))
    .catch(_ => { log.error('MongoDB failed to connect, some commands may not work.\n(Make sure the db is running with \'npm run db\') ') });

  DiscordClient.connect({
    token: env.DISCORD_TOKEN,

    onReady: async client => {
      log.info('Bastion connected', { tag: client.user?.tag, version: env.VERSION });

      if (env.IS_PRODUCTION) {
        const channel = await client.channels.fetch(channels.bot_admin);
        channel?.isText() && channel.send(`🤖 BoredBot Online! v${env.VERSION}`);
      }

      onStartup.forEach(loader => loader(client));
    },

    onMessage: message => {
      Commands.run(message);
      // todo: deprecate
      commands(message);
    },

    onReaction: _ => _
  });
}

// GO!
start();