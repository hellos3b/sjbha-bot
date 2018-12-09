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

                return `**Bank**: ${user.bucks} royroybucks`
            }
        }

    ]
}