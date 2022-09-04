/**
 *  Let people subscribe/unsubscribe from taggable roles
 * 
 */

import deepmerge from 'deepmerge'
import chalk from 'chalk'

const baseConfig = {
    command: 'vote',
    upvote: ':upvote:482642169757302784',
    downvote: ':downvote:482642189437108225'
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)

    return [
        {
            command: config.command,

            validate(context, tag) {
                console.log("validate")
                if (context.message.split(" ").length === 1) return "Vote for what"
            },

            resolve: async function(context, tag) { 
                const channelID = context.channelID
                const msgId = context.evt.d.id
                await bastion.bot.addReaction({
                    channelID: channelID,
                    messageID: msgId,
                    reaction: config.upvote
                })
        
                await bastion.bot.addReaction({
                    channelID: channelID,
                    messageID: msgId,
                    reaction: config.downvote
                })
            }
        }
    ]
}