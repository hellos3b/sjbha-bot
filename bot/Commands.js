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
        } catch (e) {
            logger.error(e);
        }
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
    },

    "!help": async function({ bot, message, userID, channelID }) {
        await bot.sendMessage({
            to: channelID,
            message:
                "1. **Creating a meetup (BASIC):** \n"+
                "```!meetup month/time hour:min | meetup_info```\n\n"+
                "*Examples:*\n"+
                "   ```!meetup 4/3 5:00pm | Bowling in Sunnyvale\n" + 
                "!meetup Friday 6:00pm | Free comedy @ Hapas```\n\n" +
                "2. **Advanced Options:** \n" +
                "You can add advanced options by adding more | (pipes) and setting the option using `like:this`\n\n" +
                "*Example:*\n" +
                "   ```!meetup Friday 6pm | Free comedy @ Hapas | description: Meet early for beers```\n" +
                "The options you can set:\n" +
                "```" +
                "   description: Add additional information to the meetup\n" +
                "   location: An address to meet at\n" +
                "   url: A url for more information\n" +
                "   image: add a thumbnail for the meetup\n" +
                "   type: Changes the icon for the meetup\n" +
                "       (accepted types: event, drinks, food, active)```\n" +
                "*Example*:\n" +
                "   ```!meetup tomorrow 12pm | Hike up a mountain | description: meet at parking lot B, we're doing route A->B | url: http://somemap.com | type: active```\n\n" +
                "3. **Canceling a meetup:** \n"+
                "   ```!cancel```\n\n"+
                "4. **Editing a meetup:** \n"+
                "   ```!edit```"
        });
    },

};
