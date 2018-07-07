/**
 *  List of commands for the bot to listen to
 * 
 */

import logger from 'winston'
import Query from './Query'
import channels from './channels'
import moment from 'moment'
import MeetupsPlaintext from './MeetupsPlaintext'

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

    "!plaintext": async function({bot, channelID}) {
        MeetupsPlaintext.update({bot});
        await bot.sendMessage({
            to: channelID,
            message: "Updated plaintext channel"
        })
    }

};
