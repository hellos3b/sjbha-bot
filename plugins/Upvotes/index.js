/**
 *  Let people subscribe/unsubscribe from taggable roles
 * 
 */

import deepmerge from 'deepmerge'
import chalk from 'chalk'

const baseConfig = {
    upvote: ':upvote:482642169757302784',
    downvote: ':downvote:482642189437108225',
    phrases: [
        "what do you think of",
        "should i"
    ]
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)

    bastion.on('message', (context, evt) => {
        for (var i = 0; i < config.phrases.length; i++) {
            if (context.message.toLowerCase().startsWith(config.phrases[i])) {
                tagMessage(context.channelID, context.evt.d.id)
                return
            }
        }
    })

    async function tagMessage(channelID, msgId) {
        await bastion.bot.addReaction({
            channelID: channelID,
            messageID: msgId,
            reaction: config.upvote
        });

        await bastion.bot.addReaction({
            channelID: channelID,
            messageID: msgId,
            reaction: config.downvote
        });
    }

    return []
}