import dotenv from 'dotenv'
dotenv.config();

import logger from 'winston'
import Bastion from './bot/Controller'
import Server from './ui/server'
import cron from 'node-cron'
import DB from './db/MLab'
import keepalive from './keepalive'

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

const bastion = Bastion({
    token: process.env.DISCORD_TOKEN,
    modules: [ 
        Ping 
    ]
})

bastion.on("ready", () => { console.log("event ready"); });

bastion.connect()

// DB.connect();

// if (process.env.NODE_ENV !== "web") {
//     Bot.start();

//     // Update finished meetups
//     // 4 hours - 0 */4 * * *
//     //*/5 * * * *

//     cron.schedule('0 */2 * * *', function(){
//         Bot.cron();
//     });

//     cron.schedule('28 0 * * 1', function(){
//         Bot.weeklyCron();
//     });

//     cron.schedule('0 * * * *', function() {
//         Bot.hourlyCron();
//     })

//     // When shutting down
//     process.on('SIGTERM', function () {
//     Bot.shutdown();
//     });
// }