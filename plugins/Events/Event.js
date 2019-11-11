import chrono from 'chrono-node'
import moment from 'moment'
import 'moment-timezone'
import GUID from "../../utils/GUID"
import utils from './utils'

const States = {
    STARTED: 0,
    FINISHED: 1,
    CANCELLED: 2
}

const PDT_OFFSET = -420
const PST_OFFSET = -480

const isDaylightSavings = (date) => {
    const dsStart = new Date(date.getFullYear(), 3, 10)
    const dsEnd = new Date(date.getFullYear(), 11, 3)
    return dsStart <= date && dsEnd >= date
}

const getParsedDate = (dateString) => {
    let refDate = new moment()

    // Parse the incoming date string to an ISO string
    let parsed_date = chrono.parse(dateString, refDate)[0].start;
    
    // use a new date object to check if PST/PDT
    const date = new Date(parsed_date.date())
    const offset = isDaylightSavings(date) ? PDT_OFFSET : PST_OFFSET

    console.log("parsed date?", offset)
    parsed_date.assign('timezoneOffset', offset)

    return parsed_date
}

export default function({ 
    id = GUID(), 
    date, 
    info, 
    options={},
    userID, 
    username,
    sourceChannelID,
    state = States.STARTED,
    info_id = null,
    rsvp_id = null
}, config) {
    // Parse the incoming date string to an ISO string
    let parsed_date = getParsedDate(date)

    // Create a moment instance
    let date_moment = new moment(parsed_date.date())
    // String for display in meetups/discord
    let date_str = date_moment.clone().tz("America/Los_Angeles").format("dddd M/D @ h:mma")
    // Formatted but just the date
    let date_date = date_moment.clone().tz("America/Los_Angeles").format("dddd M/D")
    // Time
    let date_time = date_moment.clone().tz("America/Los_Angeles").format("h:mma")

    console.log("   - MOMENT: ", date_moment)

    let meetup_info = `${info} | ${date_str}`

    let reactions = { yes: [], maybe: [] }

    this.parseDate = function() {
        refDate = new moment()
        let parsed_date = getParsedDate(date)
        date_moment = new moment(parsed_date.date())

        date_str = date_moment.clone().tz("America/Los_Angeles").format("dddd M/D @ h:mma")
        date_date = date_moment.clone().tz("America/Los_Angeles").format("dddd M/D")
        date_time = date_moment.clone().tz("America/Los_Angeles").format("h:mma")
    }

    this.updateInfo = function() {
        meetup_info = `${info} | ${date_str}`;
    }

    this.getDate = async function(bot) {
        await bot.sendMessage({
            to: sourceChannelID,
            message: `When is the meetup?`
        })

        // date = await Query.wait({ userID, channelID: sourceChannelID })

        if (date === null) {
            return `I'm cancelling the meetup request, if you want to try again restart from the beginning`
        }

        this.parseDate()

        if (!date_moment.isValid()) {
            return `Don't think that's a real date. Try starting a new meetup again with \`!meetup\``
        }

        return null;
    }

    this.validate = function(opt) {
        opt = opt || options
        if (!opt.name || !opt.date) {
            return "Missing date or name"
        }

        let refDate = new moment().tz("America/Los_Angeles")
        let pd = chrono.parse(opt.date, refDate)[0].start
        pd.assign('timezoneOffset', -420)
        const m = new moment(pd.date())      

        // Date is an actual date  
        if (!m.isValid()) {
           return `🤔 Not sure if that date is valid. I'm having trouble understanding \`${date}\`, try:  \`month/day time (am/pm)\``;
        }

        // Date is not in the past
        if (refDate.diff(m, 'seconds') > 0) {
            return `${config.name} is set to the past, needs to be a future date`
        }

        // Date is not too far into the future
        if (refDate.diff(date_moment, 'days') < -180) {
            return `Date is set too far into the future`
        }
    }

    this.announce = function(bot) {
        let embed = this.embed();

        return new Promise( async function(resolve, reject) {
            let response = await bot.sendMessage({
                to: config.announcementChannel,
                embed: embed
            });

            info_id = response.id;

            let { id: msg_id } = await bot.sendMessage({
                to: config.announcementChannel,
                message: `RSVP for **${info}**`
            });

            rsvp_id = msg_id;

            await bot.addReaction({
                channelID: config.announcementChannel,
                messageID: msg_id,
                reaction: config.reactionMaybe
            });
                
            await bot.addReaction({
                channelID: config.announcementChannel,
                messageID: msg_id,
                reaction: config.reactionYes
            });

            resolve();
        });
    }

    this.embed = function(full=true) {
        
        let fields = [
            {
              "name": "Date",
              "value": date_date,
              "inline": true
            },
            {
              "name": "Time",
              "value": date_time,
              "inline": true
            }
        ];

        if (options.location) {
            let addy = encodeURIComponent(options.location);
            let url = "https://www.google.com/maps/search/?api=1&query=" + addy;
            fields.push({
                name: "Location",
                value: `[${options.location}](${url})`
            });
        }

        if (options.url) {
            fields.push({
                name: "URL",
                value: `[${options.url}](${options.url})`
            });
        }

        let icon_url = config.typeIcons.notype;
        if (options.type) {
            if (config.typeIcons[options.type]) {
                icon_url = config.typeIcons[options.type];
            }
        }

        if (full) {
            fields.push({
                name: "Channel",
                value: `<#${sourceChannelID}>`
            });
        }

        let embed = {
            "color": 123456,
            "author": {
                "name": info,
                "icon_url": icon_url,
                "url": utils.GCALLink(this.toJSON())
            },
            fields
        };

        if (full) {
            embed.footer = {
                "text": `Started by @${username}`,
                "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
            }
        }

        if (options.description) {
            embed.description = options.description;
        }

        if (options.image) {
            embed.thumbnail = {
                url: options.image
            };
        }

        return embed;
    };

    this.confirm = async function(bot) {
        return new Promise(async function(resolve) {
            await bot.sendMessage({
                to: sourceChannelID,
                message: `Meetup added: \`${meetup_info}\` Find it in <#${config.announcementChannel}>!`
            });

            resolve();
        });
    }

    this.getReactions = async function(bot) {
        let maybe, yes;

        try {
            maybe = await bot.getReaction({
                channelID: config.announcementChannel,
                messageID: rsvp_id,
                reaction: config.reactionYes
            })

            yes = await bot.getReaction({
                channelID: config.announcementChannel,
                messageID: rsvp_id,
                reaction: config.reactionMaybe
            })
        } catch (err) {
            console.log("Failed to get reactions, setting to 0")
            console.log(err)
            maybe = []
            yes = []
        }

        maybe = maybe.filter( m => !m.bot );
        yes = yes.filter( m => !m.bot );

        reactions = {
            yes: yes.map( u => ({ id: u.id, username: u.username })),
            maybe: maybe.map( u => ({ id: u.id, username: u.username }))
        };
        return reactions;
    }

    this.finish = async function(bot) {
        state = States.FINISHED;
        await bot.deleteMessage({
            channelID: config.announcementChannel,
            messageID: rsvp_id
        });

        let rsvp_list = `(y: ${reactions.yes.length} m: ${reactions.maybe.length})`;
        
        await bot.editMessage({
            channelID: config.announcementChannel,
            messageID: info_id,
            message: `\`✅ ${meetup_info} ${rsvp_list}\`\n`
        });
    }

    this.setOwner = function(newUserID, newUser) {
        userID = newUserID
        username = newUser
    }

    this.updateAnnouncement = async function(bot) {
        let embed = this.embed()

        await bot.editMessage({
            channelID: config.announcementChannel,
            messageID: info_id,
            embed: embed
        });

        await bot.editMessage({
            channelID: config.announcementChannel,
            messageID: rsvp_id,
            message: `RSVP for **${info}**`
        });
    }

    this.getMeetupString = function() {
        return Object.entries(options)
            .map( ([k,v]) => k+": "+v).join(" | ");
    }

    this.cancel = async function(bot) {
        state = States.CANCELLED;
        await bot.deleteMessage({
            channelID: config.announcementChannel,
            messageID: rsvp_id
        })

        await bot.editMessage({
            channelID: config.announcementChannel,
            messageID: info_id,
            message: `\`❌ (canceled) ${meetup_info}\`\n`
        })
    }

    this.update = function(new_options) {
        date = new_options.date;
        info = new_options.name;
        options = new_options;
        this.parseDate();
        this.updateInfo();
    }

    this.id = () => id;
    this.info_id = () => info_id;
    this.info = () => meetup_info;
    this.info_str = () => info;
    this.date = () => date;
    this.date_str = () => date_str;
    this.date_moment = () => date_moment;

    this.toJSON = function() {
        return {
            id,
            date, 
            timestamp: date_moment.toISOString(),
            info, 
            options,
            userID, 
            username,
            sourceChannelID, 
            state, 
            info_id,
            rsvp_id
        };
    }

    this.toArchiveJSON = async function(bot) {
        let reactions = await this.getReactions(bot);
        return {
            id,
            date: date_moment.toISOString(),
            info, 
            options,
            userID, 
            username,
            sourceChannelID, 
            info_id,
            reactions
        };
    }
}