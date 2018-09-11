/**
 *  List of commands for the bot to listen to
 * 
 */

import Meetup from './Meetup'
import MeetupsDB from './MeetupsDB'
import logger from 'winston'
import Query from './Query'
import channels from './channels'
import moment from 'moment'
import Poll from './Poll'
import MeetupsPlaintext from './MeetupsPlaintext'
import BanReasons from './banreasons'
import TLDRDB from '../db/models/TLDRdb'
import TeamDB from './teams/TeamDB'
import Points from './teams/Points'
import Strava from './strava/Strava'
import Table from 'ascii-table'
import download from 'image-downloader'
import StravaLevels from './strava/StravaLevels'

const SERVER_ID = "358442034790400000";
const TEAMS = [{
    name: "Pink Bombers",
    id: "466368518049497088"
}, {
    name: "Green Mafia",
    id: "466368570532560897"
}, {
    name: "Resistance",
    id: "470114559911526402"
}];

const SUBSCRIPTIONS = {
    "photomeet": "486330820114513920",
    "carmeet": "486331665870749707",
    "drinks": "486331712645758996",
    "boombot": "486331751963164692"
};

let last_said = "";

export default {

    // "!admin": async function({bot, message, channelID, userID}) {
    //     if (channelID !== channels.ADMIN) {
    //         return;
    //     }
    //     const [cmd, cmd2, data] = message.split(" ");
    //     const param = cmd2.trim();

    //     if (param === "help") {
    //         await bot.sendMessage({
    //             to: channelID,
    //             message: "```" +
    //                 "!admin list\n    List current active meetups along with their IDs```"
    //         });
    //     } else if (param === "list") {
    //         let meetups = await MeetupsDB.getMeetups();
    //         if (meetups.length === 0) {
    //             await bot.sendMessage({
    //                 to: channelID,
    //                 message: "No active meetups."
    //             });
    //             return;
    //         }

    //         meetups = meetups.map( m => `${m.id}: ${m.info}`)
    //             .join("\n");

    //         await bot.sendMessage({
    //             to: channelID,
    //             message: "```"+meetups+"```"
    //         });
    //     } else if (param === "remind") {
    //         let meetupId = data;
    //         let meetup = await MeetupsDB.findMeetup(meetupId);

    //         if (!meetup) {
    //             await bot.sendMessage({
    //                 to: channelID,
    //                 message: `Can't find meetup with id \`${meetupId}\``
    //             });
    //             return;
    //         }
    //         let meetup_time = new moment(meetup.timestamp);
    //         await bot.sendMessage({
    //             to: meetup.sourceChannelID,
    //             message: `Reminder! There's the meetup \`${meetup.info}\` ${meetup_time.fromNow()}!`
    //         });
    //     } else if (param === "clean") {
    //         const meetups = await MeetupsDB.getMeetups();

    //         const old_meetups = meetups.filter(m => {
    //             let diff = moment().utcOffset(-8).diff(m.timestamp, 'hours');
    //             logger.info("Date: "+m.date + " diff: " +diff);
    //             return diff >= 2;
    //         });
    
    //         if (!old_meetups.length) {
    //             return;
    //         }
    
    //         for (var i = 0; i < old_meetups.length; i++) {
    //             let meetup = new Meetup(old_meetups[i]);
    //             let archive = await meetup.toArchiveJSON(bot);
    //             await meetup.finish(bot);
    //             MeetupsDB.archive(archive);
    //             await bot.sendMessage({
    //                 to: channels.ADMIN,
    //                 message: "`Archived "+meetup.info_str()+"`"
    //             });
    //         }
    //     }
    // },

    "!team": async function({bot, message, channelID, userID, user}) {
        let [cmd, option] = message.split(" ");

        let team = await TeamDB.findUser(userID);

        if (!team) {
            let rng = Math.floor(Math.random()*2);
            let t = TEAMS[rng];
            await TeamDB.saveUser({
                userID,
                user,
                team: t.name
            });
            await bot.addToRole({serverID: SERVER_ID, userID, roleID: t.id});
            await bot.sendMessage({
                to: channelID,
                message: `Congratulations, you have been recruited to team **${t.name}**!`
            });
        } else {
            await bot.sendMessage({
                to: channelID,
                message: `You are on team ${team.team}`
            });
        }
    
    },

    "!teams": async function({bot, message, channelID, userID, user}) {
        if (channelID !== channels.GENERAL2 && channelID !== channels.ADMIN) {
            await bot.sendMessage({
                to: channelID,
                message: `Please keep team discussion in the general-2 channel!`
            });
            return;
        }

        let [cmd, option] = message.split(" ");
        let teams = await TeamDB.getAll();

        let green = teams.filter( t => t.team === "Green Mafia" || t.oldTeam === "Green Mafia");
        let pink = teams.filter( t => t.team === "Pink Bombers" || t.oldTeam === "Pink Bombers");
        let black = teams.filter( t => t.team === "Resistance");

        let g_resist = green.filter( n => n.resist ).length;
        let p_resist = pink.filter( n => n.resist ).length;
        let greenList = green.map( n=> {
            if (n.oldTeam) {
                return null;
            }
            let resist = n.resist ? "x " : "  ";
            return resist + n.user;
        }).filter( n => !!n).join("\n");
        let pinkList = pink.map(n=> {
            if (n.oldTeam) {
                return null;
            }
            let resist = n.resist ? "x " : "  ";
            return resist + n.user;
        }).filter( n => !!n).join("\n");
        let resistList = black.map(n=> {
            let symbol = n.oldTeam[0];
            return symbol + " " + n.user;
        }).join("\n");

        let points = await Points.getPoints();

        await bot.sendMessage({
            to: channelID,
            message: `\`\`\`md\n
Team Pink Bombers [${points["Pink Bombers"]}] [-${p_resist}]
---------------
${pinkList}

Team Green Mafia [${points["Green Mafia"]}] [-${g_resist}]
-------------
${greenList}

Resistance [${points["Resistance"]}]
-------------
${resistList}
\`\`\`
`
        })
    },

    // "!debug": async function({bot, message, channelID, userID}) {
    //     if (channelID !== channels.ADMIN) {
    //         return;
    //     }

    //     const [cmd, param] = message.split(" ");

    //     if (param.trim() === "mine") {
    //         let meetups = await MeetupsDB.findByUserID(userID);

    //         if (meetups.length === 0) {
    //             await bot.sendMessage({
    //                 to: channelID,
    //                 message: "You have no active meetups"
    //             });
    //             return;
    //         }
    //         meetups = meetups.map( m => m.id + " " + m.info)
    //             .join("\n");
    //         await bot.sendMessage({
    //             to: channelID,
    //             message: meetups
    //         });
    //     } else if (param.trim() === "reactions") {
    //         let meetup_json = await MeetupsDB.getLatest();
    //         let meetup = new Meetup(meetup_json);
    //         let reactions = await meetup.getReactions(bot);
    //         await bot.sendMessage({
    //             to: channelID,
    //             message: `Yes: ${reactions.yes.length}, Maybe: ${reactions.maybe.length}`
    //         });
    //     } else if (param.trim() === "meetups") {
    //         await bot.sendMessage({
    //             to: channelID,
    //             message: "https://sjbha-bot.herokuapp.com/db/meetups.json"
    //         })
    //     } else if (param.trim() === "archive") {
    //         await bot.sendMessage({
    //             to: channelID,
    //             message: "https://sjbha-bot.herokuapp.com/db/archive.json"
    //         })
    //     } else if (param.trim() === "leaderboard") {
    //         await bot.sendMessage({
    //             to: channelID,
    //             message: "https://sjbha-bot.herokuapp.com/db/swirls.json?f=leaderboard"
    //         })
    //     } else if (param.trim() === "count") {
            
    //     }
    // },

    "!meetups": async function ({bot, message, userID, channelID }) {
        const [cmd, option] = message.split(" ");

        let meetups = await MeetupsDB.getMeetups(userID);
        meetups = meetups.map( m => new Meetup(m))
            .sort( (a, b) => {
                if (a.date_moment().toISOString() < b.date_moment().toISOString())
                    return -1;
                if (a.date_moment().toISOString() > b.date_moment().toISOString())
                    return 1;
                return 0;
            });

        var REFERENCE = moment(); // fixed just for testing, use moment();
        var TODAY = REFERENCE.clone().startOf('day');
        var TOMORROW = REFERENCE.clone().add(1, 'days').startOf('day');
        var A_WEEK = REFERENCE.clone().add(8, 'days').startOf('day');

        function isToday(momentDate) {
            return momentDate.isSame(TODAY, 'd');
        }
        function isTomorrow(momentDate) {
            return momentDate.isSame(TOMORROW, 'd');
        }
        function isWithinAWeek(momentDate) {
            return momentDate.isBefore(A_WEEK);
        }
        function isSameDayAndMonth(d1, d2){
            return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth()
        }

        if (option === "today") {
            meetups = meetups.filter( m => isSameDayAndMonth(m.date_moment().toDate(), new Date()) );

            if (!meetups.length) {
                await bot.sendMessage({
                    to: channelID,
                    message: "There are no scheduled meetups for today!"
                });
                return;
            }
        }
        if (option === "week") {
            meetups = meetups.filter( m => isWithinAWeek(m.date_moment()) );
            if (!meetups.length) {
                await bot.sendMessage({
                    to: channelID,
                    message: "There are no scheduled meetups for this week!"
                });
                return;
            }
        }

        if (!meetups.length) {
            await bot.sendMessage({
                to: channelID,
                message: "There are no scheduled meetups coming up"
            });
            return;
        }
        
        let fields = [];

        for (var i = 0; i < meetups.length; i++) {
            let m = meetups[i];
            let title = m.info_str();
            let fromNow = m.date_moment().fromNow();
            let date = m.date_moment().format("dddd, MMMM D @ h:mma");
            let str = `\`\`\`py\n@ ${title}\n# ${fromNow} - ${date}\`\`\``;
            fields.push(str);
        }
        let msg = fields.join("\n");

        await bot.sendMessage({
            to: channelID,
            message: msg
        });
    },

};
