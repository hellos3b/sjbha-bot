import dotenv from 'dotenv'
dotenv.config();

import logger from 'winston'
import Bot from './bot/Controller'
import Server from './ui/server'
import cron from 'node-cron'

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

Bot.start();

// Update finished meetups
// 4 hours - 0 */4 * * *
//*/5 * * * *
cron.schedule('* * * * *', function(){
    Bot.cron();
});
  