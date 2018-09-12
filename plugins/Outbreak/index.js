/**
 *  Use this as the base template for a new command
 * 
 */

import deepmerge from 'deepmerge'
import './Schema'

const baseConfig = {
    command: "outbreak",
    restrict: []
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const q = new bastion.Queries('Outbreak')
    const log = bastion.Logger("Outbreak").log

    return [

        {
            command: config.command,
            restrict: config.restrict,
            restrictMessage: "Outbreak limited to general 2",

            options: bastion.parsers.args(["cmd"]),

            resolve: async function(context, cmd) {
                if (cmd === "spread") return this.route("spread")

                const startDate = new Date("2018-09-04T18:39:00.000Z")
                const user = await q.findOne({ userID: context.userID })

                if (!user) return "You escaped the outbreak free!"

                const msdiff = new Date(user.timestamp).getTime() - startDate.getTime()
                const diff = this.msToHMS(msdiff)
                const hourstamp = this.pad(diff.hours) + ":" + this.pad(diff.minutes)

                let msg = user.message.replace(context.userID, context.user)
                msg = msg.replace("125829654421438464", "s3b")

                const action = (user.infection === "infected") ? "was infected by" : "got immunity from"

                if (user.infectedBy === "Patient Zero") {
                    const tagline = (user.infection === "infected") ?
                        `At 0:00 we first spotted signs of infection in ${context.user}` :
                        `At 0:01 an immunity was discovered by ${context.user}`;

                    return bastion.helpers.code(`CAPTAINS LOG\n` +
                        `${tagline}\n\n` +
                        `MESSAGE:\n` +
                        `     ${msg}`)
                }
                let result = `${context.user}\nSTATUS: ${user.infection}\n` +
                `${hourstamp} hours after outbreak\n`
                result += `${context.user} ${action} ${user.infectedBy}\n\n`
                result += `MESSAGE:\n`
                result += `     ${msg}`
                return bastion.helpers.code(result)
            },

            methods: {
                msToHMS( ms ) {
                    // 1- Convert to seconds:
                    var seconds = ms / 1000;
                    // 2- Extract hours:
                    var hours = parseInt( seconds / 3600 ); // 3,600 seconds in 1 hour
                    seconds = Math.floor(seconds % 3600); // seconds remaining after extracting hours
                    // 3- Extract minutes:
                    var minutes = parseInt( seconds / 60 ); // 60 seconds in 1 minute
                    // 4- Keep only seconds not extracted to minutes:
                    seconds = Math.floor(seconds % 60);
                    return { hours, minutes, seconds };
                },
                pad(v) {
                    return (v < 10) ? `0${v}` : v;
                }
            }
        },

        {
            action: `${config.command}:spread`,

            resolve: async function(context, cmd) {
                const user = await q.findOne({ userID: context.userID })
                const list = await q.find({ infectedByID: context.userID })

                if (!user) return "You haven't been tagged with anything"

                const startDate = new Date("2018-09-04T18:39:00.000Z")
                const userList = list.map( n => {
                    const msdiff = new Date(n.timestamp).getTime() - startDate.getTime()
                    const diff = this.msToHMS(msdiff)
                    const hourstamp = this.pad(diff.hours) + ":" + this.pad(diff.minutes)
                    return bastion.bot.fixMessage(`[${hourstamp}]n.user`)
                }).join(", ")
                const verb = (user.infection === "infected") ? "infection": "immunity"
                return bastion.helpers.code(`${context.user} spread ${verb} to ${list.length} other users:\n${userList}`)
            },

            methods: {
                msToHMS( ms ) {
                    // 1- Convert to seconds:
                    var seconds = ms / 1000;
                    // 2- Extract hours:
                    var hours = parseInt( seconds / 3600 ); // 3,600 seconds in 1 hour
                    seconds = Math.floor(seconds % 3600); // seconds remaining after extracting hours
                    // 3- Extract minutes:
                    var minutes = parseInt( seconds / 60 ); // 60 seconds in 1 minute
                    // 4- Keep only seconds not extracted to minutes:
                    seconds = Math.floor(seconds % 60);
                    return { hours, minutes, seconds };
                },
                pad(v) {
                    return (v < 10) ? `0${v}` : v;
                }
            }
        }

    ]
}