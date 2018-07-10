/*
*   Used to handle rate limiting on the bot, and wrap sendMessage into es6 promises
*/
import logger from 'winston'

function sendMessageDelayed(bot, callback, options, timeout=0, resolve, reject) {
    setTimeout( function() {
        callback.call(bot, options, async function(err, data) {
            if (err) {
                // if being rate limited
                if (err.statusCode == 429) {
                    let retry_after = err.response.retry_after;
                    logger.debug("!! Rate limited, retrying after "+retry_after);
                    return sendMessageDelayed(bot, callback, options, retry_after+100, resolve);
                } else {
                    logger.error(err.message);
                    logger.error(err);
                    reject(err);
                }
            } else {
                resolve(data);
            }
        });
    }, timeout);
}

function sendMessage(bot, callback, options, timeout=0) {
    return new Promise(function(resolve, reject) {
        sendMessageDelayed(bot, callback, options, timeout, resolve, reject);
    });
}

export default function(bot) {
    bot.sendMessageOld = bot.sendMessage;
    bot.sendMessage = function(opt) {
        logger.debug("bot.sendMessage", opt);
        return sendMessage(bot, bot.sendMessageOld, opt);
    };

    bot.addReactionOld = bot.addReaction;
    bot.addReaction = function(opt) {
        logger.debug("bot.addReaction", opt);
        return sendMessage(bot, bot.addReactionOld, opt);
    };

    bot.deleteMessageOld = bot.deleteMessage;
    bot.deleteMessage = function(opt) {
        logger.debug("bot.deleteMessage", opt);
        return sendMessage(bot, bot.deleteMessageOld, opt);
    };

    bot.editMessageOld = bot.editMessage;
    bot.editMessage = function(opt) {
        logger.debug("bot.editMessage", opt);
        return sendMessage(bot, bot.editMessageOld, opt);
    };

    bot.getReactionOld = bot.getReaction;
    bot.getReaction = function(opt) {
        logger.debug("bot.getReaction", opt);
        return sendMessage(bot, bot.getReactionOld, opt);
    };

    bot.addToRoleOld = bot.addToRole;
    bot.addToRole = function(opt) {
        logger.debug("bot.addToRole", opt);
        return sendMessage(bot, bot.addToRoleOld, opt);
    };

    return bot;
}