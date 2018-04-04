import Sugar from 'sugar-date'
import moment from 'moment'

import MeetupsDB from './MeetupsDB'

import logger from 'winston'
import GUID from "../utils/GUID"

import Query from "./Query"
import channels from "./channels"

const States = {
    STARTED: 0,
    FINISHED: 1,
    CANCELLED: 2
};

export default function({ 
    id = GUID(), 
    date, 
    info, 
    userID, 
    username,
    sourceChannelID,
    state = States.STARTED,
    info_id = null,
    rsvp_id = null
}) {
    // parse date
    let parsed_date = Sugar.Date.create(date).toISOString();
    let date_moment = new moment(parsed_date).utcOffset(-8, true);
    let date_str = date_moment.format("dddd M/D @ h:mma");

    let meetup_info = `${info} | ${date_str}`;

    let reactions = { yes: [], maybe: [] };

    this.parseDate = function() {
        parsed_date = Sugar.Date.create(date);
        date_moment = new moment(parsed_date);
        date_str = date_moment.format("dddd M/D @ h:mma");
    }

    this.updateInfo = function() {
        meetup_info = `${info} | ${date_str}`;
    }

    this.getDate = async function(bot) {
        await bot.sendMessage({
            to: sourceChannelID,
            message: `When is the meetup?`
        });

        date = await Query.wait({ userID, channelID: sourceChannelID });

        if (date === null) {
            return `I'm cancelling the meetup request, if you want to try again restart from the beginning`;
        }

        this.parseDate();

        if (!date_moment.isValid()) {
            return `Don't think that's a real date. Try starting a new meetup again with \`!meetup\``;
        }

        return null;
    }

    this.getInfo = async function(bot) {
        await bot.sendMessage({
            to: sourceChannelID,
            message: `What is the meetup? (Bowling @ sunnyvale, swirls @ Aquis)`
        });

        info = await Query.wait({ userID, channelID: sourceChannelID });

        if (!info) {
            return `I'm cancelling the meetup request, if you want to try again restart from the beginning`
        }

        this.updateInfo();

        return null;
    }

    this.validate = async function(bot, question=true) {
        let msg = null;
        // Has both info and date set
        if (!info && !date) {
            if (!question) {
                logger.warn("Invalid date or info");
                return "Invalid date or info";
            }
            let date_error = await this.getDate(bot);
            if (date_error) {
                logger.warn(date_error);
                return date_error;
            } 

            let info_error = await this.getInfo(bot);

            if (info_error) {
                logger.warn(info_error);
                return info_error;
            }
        }

        if (!info || !date) {

        }

        // Date is an actual date
        if (!date_moment.isValid()) {
            msg =  `🤔 Not sure if that date is valid. I'm having trouble understanding \`${date}\`, try:  \`month/day time (am/pm)\``;
        }

        // Date is not in the past
        // if (moment().utcOffset(-8).diff(date_moment, 'seconds') > 0) {
        //     msg =  `Would be a cool meetup if we had a time machine, but we don't. Try choosing a time in the future!`;
        // }

        // Date is not too far into the future
        if (moment().utcOffset(-8).diff(date_moment, 'days') < -90) {
            msg =  `Realistically though, I don't think we're planning out meetups more than 3 months in advance. Thanks for testing out my validations though!`;
        }

        if (msg) {
            logger.warn(msg);
            return msg;
        }
        return null;
    }

    this.announce = function(bot) {
        return new Promise( async function(resolve, reject) {
            logger.info("Announcing meetup");
            let response = await bot.sendMessage({
                to: channels.MEETUP,
                message: `\`👉 ${meetup_info}\`\n`
                    +    `*Started by <@!${userID}> in <#${sourceChannelID}>* `
            });
            logger.info("ID: ", response.id);
            info_id = response.id;

            let { id: msg_id } = await bot.sendMessage({
                to: channels.MEETUP,
                message: `Going to **${info}**? \`check = Yes \:thinking: = Maybe\``
            });

            rsvp_id = msg_id;

            await bot.addReaction({
                channelID: channels.MEETUP,
                messageID: msg_id,
                reaction: "☑"
            });
                
            await bot.addReaction({
                channelID: channels.MEETUP,
                messageID: msg_id,
                reaction: "🤔"
            });

            resolve();
        });
    }

    this.confirm = async function(bot) {
        return new Promise(async function(resolve) {
            logger.info("Confirming meetup");
            await bot.sendMessage({
                to: sourceChannelID,
                message: `Meetup added: \`${meetup_info}\` Find it in <#${channels.MEETUP}>!`
            });

            resolve();
        });
    }

    this.getReactions = async function(bot) {
        let maybe = await bot.getReaction({
            channelID: channels.MEETUP,
            messageID: rsvp_id,
            reaction: "🤔"
        });

        let yes = await bot.getReaction({
            channelID: channels.MEETUP,
            messageID: rsvp_id,
            reaction: "☑"
        });

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
            channelID: channels.MEETUP,
            messageID: rsvp_id
        });

        let rsvp_list = `(y: ${reactions.yes.length} m: ${reactions.maybe.length})`;
        
        await bot.editMessage({
            channelID: channels.MEETUP,
            messageID: info_id,
            message: `\`✅ ${meetup_info} ${rsvp_list}\`\n`
        });
    }

    this.editInfo = async function(bot) {
        await bot.editMessage({
            channelID: channels.MEETUP,
            messageID: info_id,
            message: `\`${meetup_info}\`\n`
                +    `*Started by <@!${userID}> in <#${sourceChannelID}>* `
        });

        await bot.editMessage({
            channelID: channels.MEETUP,
            messageID: rsvp_id,
            message: `Going to **${info}**? \`check = Yes \:thinking: = Maybe\``
        });
    }

    this.cancel = async function(bot) {
        state = States.CANCELLED;
        await bot.deleteMessage({
            channelID: channels.MEETUP,
            messageID: rsvp_id
        });

        await bot.editMessage({
            channelID: channels.MEETUP,
            messageID: info_id,
            message: `\`❌ (canceled) ${meetup_info}\`\n`
        });
    }

    this.update = function(new_date, new_info) {
        date = new_date;
        info = new_info;
        this.parseDate();
        this.updateInfo();
    }

    this.id = () => id;
    this.info = () => meetup_info;
    this.info_str = () => info;
    this.date = () => date;

    this.toJSON = function() {
        return {
            id,
            date, 
            timestamp: date_moment.toISOString(),
            info, 
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
            userID, 
            username,
            sourceChannelID, 
            info_id,
            reactions
        };
    }
}