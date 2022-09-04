/*
*   Used to handle rate limiting on the bot, and wrap bot features into es6 promises
*/
import logger from 'winston'

function extendMethodDelay(bot, callback, options, timeout=0, resolve, reject) {
    setTimeout( function() {
        callback.call(bot, options, async function(err, data) {
            if (err) {
                // if being rate limited
                if (err.statusCode == 429) {
                    console.log("status code 429 error")
                    console.log(err)
                    let retry_after = err.response.retry_after;
                    logger.debug(`Rate limited, retrying after ${retry_after}ms`);
                    return extendMethodDelay(bot, callback, options, retry_after+100, resolve);
                } else {
                    logger.error(err.message);
                    console.log(err);
                    reject(err);
                }
            } else {
                resolve(data);
            }
        });
    }, timeout);
}

function extendMethod(bot, callback, options, timeout=0) {
    return new Promise(function(resolve, reject) {
        extendMethodDelay(bot, callback, options, timeout, resolve, reject);
    });
}

function _extend(bot, methodName) {
    const tmp = `${methodName}Old`;
    bot[tmp] = bot[methodName];
    bot[methodName] = function(opt) {
        logger.debug(`bot.${methodName}`, opt);
        return extendMethod(bot, bot[tmp], opt);
    };
}

export default function(bot) {

    _extend(bot, "sendMessage");
    _extend(bot, "addReaction");
    _extend(bot, "deleteMessage");
    _extend(bot, "editMessage");
    _extend(bot, "getReaction");
    _extend(bot, "addToRole");
    _extend(bot, "removeFromRole");
    _extend(bot, "uploadFile");

    return bot;
}