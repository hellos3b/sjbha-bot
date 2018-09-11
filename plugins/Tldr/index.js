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
                const channel = bastion.bot.channels[context.channelID]
                await q.create({ 
                    message: msg, 
                    from: context.user, 
                    channelID: context.channelID, 
                    channel: channel.name 
                })

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

                return list
            },

            methods: {
                getRecent() {
                    return q.Schema.find()
                        .sort({'timestamp': -1})
                        .limit(10)
                        .exec()
                },

                formatTLDRs(tldrs) {
                    return tldrs.reverse().map( td => {
                        let m = new moment(td.timestamp);
                        let date = m.format('ddd M/D h:mma');
                        const channel = td.channel? `[#${td.channel}]` : ""
                        return `${td.message}\n\`${date} [${td.from}]${channel}\`\n`;
                    }).join("\n")
                }
            }
        }

    ]
}