/**
 *  Let people subscribe/unsubscribe from taggable roles
 * 
 */

import deepmerge from 'deepmerge'
import moment from 'moment'
import './tldrSchema'

const baseConfig = {
    command: "tldr",
    listRestrict: [],
    restrict: []
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const cmd = bastion.command(config.command)
    const help = `Use ${cmd} to view a list of most recent tldrs, or add a tldr by using ${cmd} <msg>`

    const q = new bastion.Queries('tldr')

    return [

        {
            command: config.command,
            help,

            resolve: async function(context, message) {
                if (!message) return this.route("show")

                const msg = bastion.bot.fixMessage(message)
                await q.create({ message: msg, from: context.user })

                return "Saved, thanks!"
            }
        },

        {
            action: `${config.command}:show`,
            restrict: config.listRestrict,
            restrictMessage: `You can only get the TLDR list in the general 2 channel`, 

            resolve: async function(context, message) {
                const tldrs = await this.getRecent()
                const list = this.formatTLDRs(tldrs)

                return `Catch up on what's going on!\n${list}`
            },

            methods: {
                getRecent() {
                    return q.Schema.find()
                        .sort({'timestamp': -1})
                        .limit(10)
                        .exec()
                },

                formatTLDRs(tldrs) {
                    return tldrs.map( td => {
                        let m = new moment(td.timestamp);
                        let date = m.format('ddd M/D h:mm a');
                        return `\`${date} - [${td.from}] - ${td.message}\``;
                    }).join("\n")
                }
            }
        }

    ]
}