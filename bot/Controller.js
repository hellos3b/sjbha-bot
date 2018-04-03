import Discord from 'discord.io'
import logger from 'winston'
import Commands from "./Commands"
import DiscordIOExtend from "./DiscordIO-extend"
import Query from "./Query"
import MeetupsDB from './MeetupsDB'
import moment from 'moment'

let bot = null;
const ADMIN_CHANNEL_ID = "430517752546197509";

export default {

    start() {
        bot = new Discord.Client({
            token: process.env.DISCORD_TOKEN,
            autorun: true
        });

        // Modify bot.sendMessage to use promises
        bot = DiscordIOExtend(bot);
    
        // Log when ready
        bot.on('ready', evt => {
            logger.info('Connected!');
            logger.info(`Logged in as: ${bot.username} [${bot.id}]`);
        });
    
        // Captures all messages
        bot.on('message', (user, userID, channelID, message, evt) => {
            // Our bot needs to know if it will execute a command
            // It will listen for messages that will start with `!`
            if (message.substring(0, 1) == '!') {
                this.router({ bot, user, userID, channelID, message, evt });
            } else {
                Query.check(message, {userID, channelID});
            }
        });        
    },

    router(context) {
        logger.info(`<${context.user}> ${context.message}`);

        const [cmd] = context.message.split(" ");
    
        if (cmd in Commands) {
            Commands[cmd](context);
        } else {
            logger.debug("Command not found, skipping");
        }
    },

    /*
    *   mark old meetups as finished automatically
    */
    cron: async function() {
        const meetups = MeetupsDB.getMeetups();

        const old_meetups = meetups.filter(m => {
            let diff = moment().utcOffset(-8).diff(m.timezone, 'hours');
            logger.info("Date: "+m.date + " diff: " +m.diff);
            return diff >= 4;
        });

        if (!old_meetups.length) {
            return;
        }

        for (var i = 0; i < old_meetups.length; i++) {
            let meetup = new Meetup(meetup_json);
            let archive = await meetup.toArchiveJSON(bot);
            await meetup.finish(bot);
            MeetupsDB.archive(archive);
        }

        bot.sendMessage({
            to: ADMIN_CHANNEL_ID,
            message: "Marked "+old_meetups.length+" meetups as finished"
        });
    }

}