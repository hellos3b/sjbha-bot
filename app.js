import dotenv from 'dotenv'
dotenv.config();

import logger from 'winston'
import Bot from './bot/Controller'
import Server from './ui/server'

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

logger.info("Starting service: "+process.env.service);
Bot.start();
Server.start();