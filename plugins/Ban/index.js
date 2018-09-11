/**
 *  Use this as the base template for a new command
 * 
 */

import deepmerge from 'deepmerge'
import reasons from './reasons'

const baseConfig = {
    command: "ban"
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const cmd = bastion.command(config.command)

    return [

        {
            // Command to start it
            command: config.command, 

            // Core of the command
            resolve: async function(context, name) {
                const reason = reasons.getReason()
                const rng = Math.floor(Math.random()*6)

                if (rng === 3) return `<@!${context.userID}> has been banned from the server; Reason: *ABUSING THE BAN COMMAND UR NOT AN ADMIN*`
                if (!name) return `<@!${context.userID}> has been banned from the server; Reason: *Doesn't know how to use the ban command properly*`

                return `${name} has been banned from the server; Reason: *${reason}*`
            }
        }

    ]
}