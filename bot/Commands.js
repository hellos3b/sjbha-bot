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

const SERVER_ID = "358442034790400000";
const TEAMS = [{
    name: "Pink Bombers",
    id: "466368518049497088"
}, {
    name: "Green Mafia",
    id: "466368570532560897"
}];

async function parseMeetupStr({bot, channelID, msg}) {
    let possibleOptions = new Set(["url", "type", "description", "location", "image"]);

    const [date, info, ...opt] = msg.split("|").map( s => s.trim() );

    let options = { date, info };
    for (var i = 0; i < opt.length; i++) {
        let [name, ...value] = opt[i].split(":").map(s => s.trim());
        name = name.toLowerCase();
        value = value.join(":");
        if (!possibleOptions.has(name)) {
            await bot.sendMessage({
                to: channelID,
                message: "Option `"+name+"` is not a valid option"
            });
        } else {
            options[name] = value;
        }
    }

    return options;
}

export default {

    // !ping
    "!ping"({bot, channelID}) {
        bot.sendMessage({
            to: channelID,
            message: "Pong (:"
        });
    },

    // Start a meetup
    "!meetup": async function({bot, user, channelID, userID, message}) {
        const msg = message.replace("!meetup", "");
        let options = await parseMeetupStr({ bot, channelID, msg });
        console.log("options", options);

        try {
            const meetup = new Meetup({
                date: options.date,
                info: options.info,
                options,
                userID,
                username: user,
                sourceChannelID: channelID
            });

            let error = await meetup.validate(bot);
            if (error) {
                bot.sendMessage({
                    to: channelID,
                    message: error
                });
                return;
            }

            // Post the meetup in meetup announcements
            await meetup.announce(bot);
            await meetup.confirm(bot);

            MeetupsDB.save(meetup);
            MeetupsPlaintext.update({bot});
        } catch (e) {
            logger.error(e);
        }
    },

    "!ban": async function({bot, message, channelID, user, userID}) {
        let [cmd, name] = message.split(" ");
        let reason = BanReasons.getReason();

        let rng = Math.floor(Math.random()*6);
        if (rng === 3) {
            await bot.sendMessage({
                to: channelID,
                message: `<@!${userID}> has been banned from the server; Reason: *ABUSING THE BAN COMMAND UR NOT AN ADMIN*`
            });

            return;
        }
        await bot.sendMessage({
            to: channelID,
            message: `${name} has been banned from the server; Reason: *${reason}*`
        });
    },

    "!swirls": async function({bot, channelID}) {
        await bot.sendMessage({
            to: channelID,
            message: "<:swirls:430968917540995072><:swirls:430968917540995072><:swirls:430968917540995072><:swirls:430968917540995072>\:laughing:\:rofl:  DID SOMEBODY SAY SWIRLS?! \:rofl:\:laughing:<:swirls:430968917540995072><:swirls:430968917540995072><:swirls:430968917540995072><:swirls:430968917540995072>"
        })
    },

    "!scooter": async function({bot, channelID}) {
        await bot.sendMessage({
            to: channelID,
            message: "<:coolscooter:443185468348170240><:coolscooter:443185468348170240>😎😎SCOOTER GANG SCOOTER GANG SCOOTER GANG😎😎<:coolscooter:443185468348170240><:coolscooter:443185468348170240>"
        })
    },

    "!scooters": async function({bot, channelID}) {
        await bot.sendMessage({
            to: channelID,
            message: "<:coolscooter:443185468348170240><:coolscooter:443185468348170240>😎😎SCOOTER GANG SCOOTER GANG SCOOTER GANG😎😎<:coolscooter:443185468348170240><:coolscooter:443185468348170240>"
        })
    },

    "!wheres": async function({bot, channelID, message}) {
        let [cmd, param] = message.split(" ");

        if (param.toLowerCase() === "james") {
            await bot.sendMessage({
                to: channelID,
                message: "<@!115794072735580162>!"
            })
        }
    },

    "!admin": async function({bot, message, channelID, userID}) {
        if (channelID !== channels.ADMIN) {
            return;
        }
        const [cmd, cmd2, data] = message.split(" ");
        const param = cmd2.trim();

        if (param === "help") {
            await bot.sendMessage({
                to: channelID,
                message: "```" +
                    "!admin list\n    List current active meetups along with their IDs```"
            });
        } else if (param === "list") {
            let meetups = await MeetupsDB.getMeetups();
            if (meetups.length === 0) {
                await bot.sendMessage({
                    to: channelID,
                    message: "No active meetups."
                });
                return;
            }

            meetups = meetups.map( m => `${m.id}: ${m.info}`)
                .join("\n");

            await bot.sendMessage({
                to: channelID,
                message: "```"+meetups+"```"
            });
        } else if (param === "remind") {
            let meetupId = data;
            let meetup = await MeetupsDB.findMeetup(meetupId);

            if (!meetup) {
                await bot.sendMessage({
                    to: channelID,
                    message: `Can't find meetup with id \`${meetupId}\``
                });
                return;
            }
            let meetup_time = new moment(meetup.timestamp);
            await bot.sendMessage({
                to: meetup.sourceChannelID,
                message: `Reminder! There's the meetup \`${meetup.info}\` ${meetup_time.fromNow()}!`
            });
        } else if (param === "clean") {
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
        }
    },

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

    "!strava": async function({bot, message, channelID, userID, user}) {
        if (channelID !== channels.ADMIN || channelID !== channels.RUN) {
            await bot.sendMessage({
                to: channelID,
                message: "This command only works in the 5K channel"
            });
            return;
        }

        let url = `https://sjbha-bot.herokuapp.com/api/strava/auth?user=${user}&userID=${userID}`;

        await bot.sendMessage({
            to: userID,
            message: `Hello! To auth the discord bot to post your strava times, just click on this link and accept the authorization\n${url}`
        });

        await bot.sendMessage({
            to: channelID,
            message: "DM'd you your authorization link!"
        });
    },

    "!tldr": async function({bot, message, channelID, userID, user}) {
        let [cmd, ...msg] = message.split(" ");
        msg = msg.join(" ");

        if (!msg) {
            if (channelID !== channels.GENERAL2) {
                await bot.sendMessage({
                    to: channelID,
                    message: `You can only get the TLDR list in the general 2 channel`
                });
                return;
            }

            let tldrs = await TLDRDB.getRecent();
            let review = tldrs.map( td => {
                let m = new moment(td.timestamp);
                let date = m.format('ddd M/D h:mm a');
                return `\`${date} - [${td.from}] - ${td.message}\``;
            }).join("\n");

            await bot.sendMessage({
                to: channelID,
                message: `Catch up on what's going on!\n${review}`
            });
        } else {
            await TLDRDB.saveTLDR({
                message: msg,
                from: user
            });
            await bot.sendMessage({
                to: channelID,
                message: `Saved, thanks!`
            });
            return;
        }
    },

    "!teams": async function({bot, message, channelID, userID, user}) {
        if (channelID !== channels.GENERAL2) {
            await bot.sendMessage({
                to: channelID,
                message: `Please keep team discussion in the general-2 channel!`
            });
            return;
        }

        let [cmd, option] = message.split(" ");
        let teams = await TeamDB.getAll();

        let green = teams.filter( t => t.team === "Green Mafia");
        let pink = teams.filter( t => t.team === "Pink Bombers");

        let greenList = green.map( n=> n.user).join("\n");
        let pinkList = pink.map( n => n.user).join("\n");

        let points = await Points.getPoints();

        await bot.sendMessage({
            to: channelID,
            message: `\`\`\`md\n
Team Pink Bombers [${points["Pink Bombers"]}]
---------------
${pinkList}

Team Green Mafia [${points["Green Mafia"]}]
-------------
${greenList}
\`\`\`
`
        })
    },

    "!debug": async function({bot, message, channelID, userID}) {
        if (channelID !== channels.ADMIN) {
            return;
        }

        const [cmd, param] = message.split(" ");

        if (param.trim() === "mine") {
            let meetups = await MeetupsDB.findByUserID(userID);

            if (meetups.length === 0) {
                await bot.sendMessage({
                    to: channelID,
                    message: "You have no active meetups"
                });
                return;
            }
            meetups = meetups.map( m => m.id + " " + m.info)
                .join("\n");
            await bot.sendMessage({
                to: channelID,
                message: meetups
            });
        } else if (param.trim() === "reactions") {
            let meetup_json = await MeetupsDB.getLatest();
            let meetup = new Meetup(meetup_json);
            let reactions = await meetup.getReactions(bot);
            await bot.sendMessage({
                to: channelID,
                message: `Yes: ${reactions.yes.length}, Maybe: ${reactions.maybe.length}`
            });
        } else if (param.trim() === "meetups") {
            await bot.sendMessage({
                to: channelID,
                message: "https://sjbha-bot.herokuapp.com/db/meetups.json"
            })
        } else if (param.trim() === "archive") {
            await bot.sendMessage({
                to: channelID,
                message: "https://sjbha-bot.herokuapp.com/db/archive.json"
            })
        } else if (param.trim() === "leaderboard") {
            await bot.sendMessage({
                to: channelID,
                message: "https://sjbha-bot.herokuapp.com/db/swirls.json?f=leaderboard"
            })
        } else if (param.trim() === "count") {
            
        }
    },

    "!finish": async function({ bot, message }) {
        const [cmd, id] = message.split(" ").map( m => m.trim() );

        const meetup_json = await MeetupsDB.findMeetup(id);
        const meetup = new Meetup(meetup_json);
        let archive = await meetup.toArchiveJSON(bot);
        await meetup.finish(bot);
        MeetupsDB.archive(archive);
    },

    "!cancel": async function({ bot, message, userID, channelID }) {
        const [cmd, id] = message.split(" ").map( m => m.trim() );

        let meetups = await MeetupsDB.findByUserID(userID);
        meetups = meetups.map( m => new Meetup(m));
        let meetup = null;

        if (meetups.length === 0) {
            await bot.sendMessage({
                to: channelID,
                message: "You don't have any active meetups to cancel!"
            });
            return;
        }

        let meetup_list = meetups.map( (m, i) => i + ": " + m.info() ).join("\n");
        await bot.sendMessage({
            to: channelID,
            message: "Which meetup do you want to cancel?\n```"+meetup_list+"```"
        });
        let index = await Query.wait({userID, channelID});
        if (index === null) {
            return;
        }
        if (index < 0 || index >= meetups.length) {
            await bot.sendMessage({
                to: channelID,
                message: "That wasn't one of the choices"
            });
            return;
        }
        meetup = meetups[index];

        await meetup.cancel(bot);
        MeetupsDB.remove(meetup);

        await bot.sendMessage({
            to: channelID,
            message: "Canceled `"+meetup.info_str()+"`"
        });

        MeetupsPlaintext.update({bot});
    },

    "!mention": async function({bot, message, channelID, userID}) {
        let [cmd, param] = message.split(" ").map(m => m.trim());

        let meetups = await MeetupsDB.getMeetups();
        meetups = meetups.map( m => new Meetup(m));
        let meetup = null;

        if (meetups.length === 0) {
            await bot.sendMessage({
                to: channelID,
                message: "There are no active meetups"
            });
            return;
        }

        let meetup_list = meetups.map( (m, i) => i + ": " + m.info() ).join("\n");
        await bot.sendMessage({
            to: channelID,
            message: "Which meetup do you want to mention?\n```"+meetup_list+"```"
        });
        let index = await Query.wait({userID, channelID});
        if (index === null) {
            return;
        }
        if (index < 0 || index >= meetups.length) {
            await bot.sendMessage({
                to: channelID,
                message: "That wasn't one of the choices"
            });
            return;
        }
        meetup = meetups[index];

        let reactions = await meetup.getReactions(bot);
        let yes_mentions = reactions.yes.map( u => `<@!${u.id}>`).join(" ");
        let maybe_mentions = reactions.maybe.map( u => `<@!${u.id}>`).join(" ");
        let mentions = "";

        if (param === "yes") {
            mentions = yes_mentions;
        } else if (param === "maybe") {
            mentions = maybe_mentions;
        } else {
            mentions = yes_mentions + " " + maybe_mentions;
        }

        await bot.sendMessage({
            to: channelID,
            message: mentions
        });
    },

    /*
        !edit date 4/3 8:00pm
        > edits most recent ones date
        !edit info Comedy night at hapa's
        !edit date
        !edit info
        !edit

    */
    "!edit": async function({bot, message, channelID, userID}) {
        let [cmd, param] = message.split(" ").map(m => m.trim());

        let meetups = await MeetupsDB.findByUserID(userID);
        meetups = meetups.map( m => new Meetup(m));
        let meetup = null;

        if (meetups.length === 0) {
            await bot.sendMessage({
                to: channelID,
                message: "You don't have any active meetups to edit!"
            });
            return;
        }

        let meetup_list = meetups.map( (m, i) => i + ": " + m.info() ).join("\n");
        await bot.sendMessage({
            to: channelID,
            message: "Which meetup do you want to edit?\n```"+meetup_list+"```"
        });
        let index = await Query.wait({userID, channelID});
        if (index === null) {
            return;
        }
        if (index < 0 || index >= meetups.length) {
            await bot.sendMessage({
                to: channelID,
                message: "That wasn't one of the choices"
            });
            return;
        }
        meetup = meetups[index];

        if (!param) {
            await bot.sendMessage({
                to: channelID,
                message: `Ok, editing \`${meetup.info_str()}\` - What do you want to change it to?\nYou can copy and paste this:\n\`${meetup.getMeetupString()}\``
            });
            let edit = await Query.wait({userID, channelID});
            if (!edit) {
                return;
            }

            let options = await parseMeetupStr({bot, channelID, msg: edit});
            meetup.update(options.date, options.info, options);
        } 
        // else if (param === "date") {
        //     await bot.sendMessage({
        //         to: channelID,
        //         message: `Ok, editing \`${meetup.info_str()}\` - What do you want to change the date to?`
        //     });
        //     let new_date = await Query.wait({userID, channelID});
        //     if (!new_date) {
        //         return;
        //     }
        //     meetup.update(new_date, meetup.info_str());
        // } else if (param === "info") {
        //     await bot.sendMessage({
        //         to: channelID,
        //         message: `Ok, editing \`${meetup.info_str()}\` - What do you want to change the info to?`
        //     });
        //     let new_info = await Query.wait({userID, channelID});
        //     if (!new_info) {
        //         return;
        //     }
        //     meetup.update(meetup.date(), new_info);
        // }

        let error = await meetup.validate(bot, false);
        if (error) {
            await bot.sendMessage({
                to: channelID,
                message: error
            });
            return;
        }

        meetup.editInfo(bot);
        MeetupsDB.save(meetup);

        await bot.sendMessage({
            to: channelID,
            message: `You got it! Updated to \`${meetup.info()}\``
        })

        MeetupsPlaintext.update({bot});
    },

    "!poll": async function({bot, message, channelID}) {
        let [cmd, ...msg] = message.split(" ");

        let [title, ...options] = msg.join(" ").split("|").map( n => n.trim() );

        let error = null;
        if (options.length < 2) {
            error = "You need at least two options to start a poll!";
        }

        if (options.length > 4) {
            error = "Sorry, only 4 options max allowed for a poll";
        }

        if (error) {
            await bot.sendMessage({
                to: channelID,
                message: error
            });
            return;
        }

        Poll({
            bot,
            channelID,
            title,
            options
        });
    },

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

        if (option === "today") {
            meetups = meetups.filter( m => isToday(m.date_moment()) );

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

    "!help": async function({ bot, message, userID, channelID }) {
        await bot.sendMessage({
            to: channelID,
            message:
                "To create a meetup, copy paste this template; only the time and event name is required:\n\n"+
                "```!meetup 12/20 6:00pm\n" + 
                "| (event-name-here) \n" + 
                "| description:\n" +
                "| location:\n" + 
                "| url:\n" +
                "| image:\n" +
                "| type: (event, drinks, food, or active)```\n" +
                "`!cancel` to cancel a meetup and `!edit` to edit\n\n" + 
                "To create a poll:\n" +
                "`!poll Question? | option 1 | option 2 | option 3 | option 4`"
        });
    },

};
