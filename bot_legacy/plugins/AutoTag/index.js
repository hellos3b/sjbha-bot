/**
 *  Let people subscribe/unsubscribe from taggable roles
 * 
 */

import deepmerge from 'deepmerge'
import roles from './roles'

const baseConfig = {
    restrict: [""]
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const restrict = new Set(config.restrict)

    const log = bastion.Logger("AutoTag").log

    bastion.on('message', async function(context) {
        if (!restrict.has(context.channelID)) return

        const message = context.message.toLowerCase()
        for (var i = 0; i < roles.length; i++) {
            const r = roles[i]
            for (var k = 0; k < r.keywords.length; k++) {
                if (message.indexOf(r.keywords[k]) > -1) {
                    tagRole(context, r)
                    return
                }
            }
        }
    })

    async function tagRole(context, role) {
        const yesses = new Set(['yes', 'y'])
        const nos = new Set(['no', 'n'])
        log(`Asking ${context.user} if they want to update their role`)
        const {message: confirm} = await bastion.Ask(`<@${context.userID}>, do you want to update your location to '${role.name}'? (y/n)`, 
            context, 
            (val) => {
                let input = val.toLowerCase()
                if (nos.has(input)) return "Okay"
                if (!yesses.has(input)) return "Was that a Yes, or a No?"
            }, 2)

        if (confirm) {
            log(`${context.user} said yes, giving them ${role.name}`)
            bastion.bot.simulateTyping(context.channelID)
            await removeRoles(context)
            await bastion.addRole(context.userID, role.roleId)
            bastion.send(context.channelID, "You got it!")
        }
    }

    function removeRoles(context) {
        const userRoles = new Set(context.evt.d.member.roles)
        return Promise.all(roles.map( r => {
            if (userRoles.has(r.roleId)) {
                log(`Removing ${r.name} from ${context.userID}`)
                return bastion.removeRole(context.userID, r.roleId)
            } else {
                return null
            }
        }).filter( n => n ))
    }

    return [

        // Subscribe
        {
            command: "help",
            restrict: config.restrict,
            resolve: async function() {
                const roleNames = roles.map( n => n.name ).join(", ")
                return "Areas you can be tagged in: " + roleNames
            }
        }

    ]
}