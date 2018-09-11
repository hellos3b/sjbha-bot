/**
 *  Let people subscribe/unsubscribe from taggable roles
 * 
 */

import deepmerge from 'deepmerge'
import chalk from 'chalk'

const baseConfig = {
    command: 'subscribe',
    commandUnsubscribe: 'unsubscribe',
    subscriptions: {}
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const help = "Tags you can subscribe to: " + Object.keys(config.subscriptions).join(", ")

    return [

        // Subscribe
        {
            command: config.command,
            help,
            helpOnEmpty: true,
            options: bastion.parsers.args(["tag"]),

            validate(context, tag) {
                if (!config.subscriptions[tag]) return `Couldn't find tag called '${tag}'`
            },

            resolve: async function(context, tag) {  
                const id = config.subscriptions[tag];
                await context.bot.addToRole({
                    serverID: bastion.config.serverId, 
                    userID: context.userID, 
                    roleID: id
                })

                await context.bot.sendMessage({
                    to: context.channelID,
                    message: `${context.user} subscribed to '${tag}'`
                })
            }
        },

        // Unsubscribe
        {
            command: config.commandUnsubscribe,
            help,
            helpOnEmpty: true,
            options: ["tag"],

            validate(context, tag) {
                if (!config.subscriptions[tag]) return `Couldn't find tag called '${tag}'`
            },

            resolve: async function(context, tag) {  
                const id = config.subscriptions[tag];
                await context.bot.removeFromRole({
                    serverID: bastion.config.serverId, 
                    userID: context.userID, 
                    roleID: id
                });

                await context.bot.sendMessage({
                    to: context.channelID,
                    message: `${context.user} unsubscribed from '${tag}'`
                });
            }

        }

    ]
}