/**
 *  Let people subscribe/unsubscribe from taggable roles
 * 
 */

import deepmerge from 'deepmerge'
import moment from 'moment'
import './rrbucksSchema'

const baseConfig = {
    command: "royroybucks",
    listRestrict: [],
    restrict: [],
    min: 100,
    max: 1000
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)

    const q = new bastion.Queries('rrbucks')

    return [

        {
            command: config.command,

            resolve: async function(context, message) {
                let user = await q.findOne({ userID: context.userID})

                if (!user) {
                    user = {
                        user: context.user,
                        userID: context.userID,
                        bucks: Math.floor(Math.random()*(config.max-config.min)) + config.min
                    }
                    await q.create(user)
                }

                const [cmd, ...args] = message.split(" ")
                console.log(cmd)
                if (cmd === 'give') return this.route("give")

                return `**Bank**: ${user.bucks} royroybucks`
            }
        },

        {
            action: `${config.command}:give`,

            resolve: async function(context, message) {
                let user = await q.findOne({ userID: context.userID})
                const [cmd, amount, targetMention] = message.split(" ")

                const bucks = parseInt(amount)
                if (isNaN(bucks)) return 'Not a valid amount. `!royroybucks give 100 @user`'
                if (bucks < 1) return 'Needs to be at least 1 royroybuck'
                if (bucks > user.bucks) return `You don't have that many royroybucks`

                if (!targetMention) return `Need to specify who to give money to. \`!royroybucks give 100 @user\``
                const target = bastion.helpers.mentionID(targetMention)
                const targetName = bastion.bot.fixMessage(targetMention)

                let reciever = await q.findOne({ userID: target})

                if (!reciever) return `${targetName} hasn't opened up a bank account yet`

                user.bucks -= bucks
                reciever.bucks += bucks

                await q.update({userID: user.userID}, user)
                await q.update({userID: reciever.userID}, reciever)

                return `👌 You gave ${targetName} ${bucks} royroybucks`
            }
        }

    ]
}