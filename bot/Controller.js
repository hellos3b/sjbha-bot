import Discord from 'discord.io'
import logger from 'winston'
import Commands from "./Commands"
import DiscordIOExtend from "./DiscordIO-extend"
import Query from "./Query"

let bot = null;

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

    cron() {
        
    }

}