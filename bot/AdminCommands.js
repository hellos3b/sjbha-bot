/**
 *  List of commands for the bot to listen to
 * 
 */

import logger from 'winston'
import Query from './Query'
import channels from './channels'
import moment from 'moment'
import MeetupsPlaintext from './MeetupsPlaintext'
import Stats from './StatsTracking'
import Points from './teams/Points'

export default {

    // !ping
    "!meetup_test": async function({bot, user, userID, channel, channelID, message }) {
        let type_icons = {
            "notype": "https://imgur.com/VXuD9Rb.png",
            "food": "https://imgur.com/TsecfdH.png",
            "alcohol": "https://imgur.com/wwDUMWP.png",
            "drinking": "https://imgur.com/wwDUMWP.png",
            "drinks": "https://imgur.com/wwDUMWP.png",
            "event": "https://imgur.com/eHxA5dN.png"
        };

        let possibleOptions = new Set(["url", "type", "description", "location"]);
        var msg = message.replace("!meetup", "");
        const [date, info, ...opt] = msg.split("|").map(s => s.trim());
        let options = { date, info };
        for (var i = 0; i < opt.length; i++) {
            let [name, ...value] = opt[i].split(":").map(s => s.trim());
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

        console.log("Meetup options", options);

        let fields = [
            {
              "name": "Date",
              "value": "Saturday June 8th",
              "inline": true
            },
            {
              "name": "Time",
              "value": "4:00PM",
              "inline": true
            }
        ];
        // if (options.description) {
        //     fields.push({
        //         name: "Description",
        //         value: options.description
        //     });
        // }
        if (options.location) {
            let url = options.location.replace(/ /g, "+");
            fields.push({
                name: "Location",
                value: options.location
            });
        }
        if (options.url) {
            fields.push({
                name: "URL",
                value: `[${options.url}](${options.url})`
            });
        }
        let icon_url = type_icons.notype;
        if (options.type) {
            if (type_icons[options.type]) {
                icon_url = type_icons[options.type];
            }
        }
        fields.push({
            name: "Channel",
            value: `<#${channelID}>`
        });

        let embed = {
            "color": 123456,
            "author": {
                "name": "Swirls Meetup",
                "icon_url": icon_url
            },
            "footer": {
                "text": `Started by @${user}`,
                "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
            },
            fields
        };

        if (options.description) {
            embed.description = options.description;
        }
        if (options.image) {
            embed.thumbnail = {
                url: options.image
            };
        }
        await bot.sendMessage({
            to: channelID,
            "embed": embed
        });
    },

    "!teamstat": async function({bot, channelID, message}) {
        let [cmd, name] = message.split(" ");
        let points = await Points.getPointsForOne(name);

        let msg = "";
        if (!points) {
            msg = "Could not find someone with that ID"
        } else {
            msg = `**${name}**: Points: ${points.total}, Yes: ${points.yes}, Maybe: ${points.maybe}`
        }
        await bot.sendMessage({
            to: channelID,
            message: msg
        });
    },

    "!plaintext": async function({bot, channelID}) {
        MeetupsPlaintext.update({bot});
        await bot.sendMessage({
            to: channelID,
            message: "Updated plaintext channel"
        })
    },

    "!stat": async function({bot, channelID}) {
        let stats = await Stats.getStats();
        await bot.sendMessage({
            to: channelID,
            message: `\`\`\`${stats.timestamp.toISOString()} count: ${stats.count}\`\`\``
        })
    },

    "!stats": async function({bot, channelID, message}) {
        let [cmd, option] = message.split(" ");
        let stats = await Stats.getHistory();
        let msg = stats.map( n => {
            let m = moment(n.timestamp);
            let x = Math.ceil( n.count / 25 );
            let chart = new Array(x + 1).join( "■" );
            let display = `[${chart}] ${n.count}`;
            if (!chart.length) {
                display = `[] ${n.count}`;
            }
            return `${m.format("ddd MM/DD hh:mm a")} ${display}`;
        }).join("\n");
        await bot.sendMessage({
            to: channelID,
            message: "```ini\n" + msg + "```"
        })
    },

    "!statsave": async function({bot, channelID}) {
        Stats.save();
        Stats.start();
        await bot.sendMessage({
            to: channelID,
            message: "Stats saved!"
        });
    }


};
