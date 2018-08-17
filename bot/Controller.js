import Discord from 'discord.io'
import logger from 'winston'
import Commands from "./Commands"
import DiscordIOExtend from "./DiscordIO-extend"
import Query from "./Query"
import MeetupsDB from './MeetupsDB'
import Meetup from './Meetup'
import moment from 'moment'
import channels from './channels'
import BoombotRouter from '../boombot/router'
import BoombotWeeklyController from '../boombot/commands/WeeklyController'
import AdminRouter from './AdminCommands'
import MeetupsPlaintext from './MeetupsPlaintext'

import SwirlCount from './SwirlCount'
import Stats from './StatsTracking'

import MarkovModel from '../db/models/MarkovModel'
import MarkovDB from '../db/models/MarkovDB'

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
            Stats.start()

            bot.sendMessage({
                to: channels.GENERAL,
                message: "👋🤖 Online!"
            });
        });
    
        // Captures all messages
        bot.on('message', async function(user, userID, channelID, message, evt) {
            // if bot
            if (userID === "430522654466768907") {
                return;
            }

            // markov testers
            // 125829654421438464 s3b
            // 95628401045409792 Blue
            // 176492310207528961 Mirelle
            // 164375823741091850 Bangerz
            const users = new Set(["125829654421438464", "95628401045409792", "176492310207528961", "164375823741091850"]);
            // Ignore bot-admin and boombot
            if (users.has(userID) && channelID !== "430517752546197509" && channelID !== "432766496700235776") {
                MarkovDB.save({ userID, message });
            }

            Stats.increment()
            // Our bot needs to know if it will execute a command
            // It will listen for messages that will start with `!`

            // Insert in a swirl count
            if (message.toLowerCase().indexOf("swirl") !== -1) {
                // SwirlCount.add({ user, userID, message });
            }

            if (message.substring(0, 1) == '!') {
                let context = { bot, user, userID, channelID, message, evt };
                const [cmd] = context.message.split(" ");
                console.log(message);

                if (channelID === channels.BOOMBOT) {
                    BoombotRouter.router(context)
                } else if (channelID === channels.ADMIN && AdminRouter[cmd]) {
                    AdminRouter[cmd](context);
                } else {
                    this.router(context);
                }
            } else {
                Query.check(message, {userID, channelID});
            }
        }.bind(this));        
    },

    router: async function(context) {
        logger.info(`<${context.user}> ${context.message}`);

        const [cmd] = context.message.split(" ");
    
        if (cmd in Commands) {
            try {
                await Commands[cmd](context);
            } catch (err) {
                console.log("ERROR");
                await bot.sendMessage({
                    to: context.channelID,
                    message: "```diff\n- "+err+"```"
                })
            }
        } else {
            logger.debug("Command not found, skipping");
        }
    },

    /*
    *   mark old meetups as finished automatically
    */
    cron: async function() {
        const meetups = await MeetupsDB.getMeetups();

        const old_meetups = meetups.filter(m => {
            let diff = moment().utcOffset(-8).diff(m.timestamp, 'hours');
            logger.info("Date: "+m.date + " diff: " +diff);
            return diff >= 2;
        });

        if (!old_meetups.length) {
            return;
        }

        for (var i = 0; i < old_meetups.length; i++) {
            let meetup = new Meetup(old_meetups[i]);
            let archive = await meetup.toArchiveJSON(bot);
            await meetup.finish(bot);
            MeetupsDB.archive(archive);
            await bot.sendMessage({
                to: channels.ADMIN,
                message: "`Archived "+meetup.info_str()+"`"
            });
        }
    },

    hourlyCron: async function() {
        MeetupsPlaintext.update({bot});
        Stats.save()
        Stats.start()
    },

    weeklyCron: async function() {
        BoombotWeeklyController.EndWeek(bot);
    },

    sendMessage: function(opt) {
        return bot.sendMessage(opt);
    },

    shutdown: async function() {
        Stats.save()
        await bot.sendMessage({
            to: channels.ADMIN,
            message: "```SIGTERM shutdown```"
        });
    }

}