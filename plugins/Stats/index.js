/**
 *  Use this as the base template for a new command
 * 
 */

import deepmerge from 'deepmerge'
import Stats from './tracker'
import moment from 'moment'
import './Schema'

const baseConfig = {
    command: 'stats',
    restrict: null,
    ignore: [],  // Channels to ignore stats for
    ignoreUsers: [] // Ignore specific people
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const cmd = bastion.command(config.command)
    const help = `${cmd} (description)`

    bastion.on('message', () => Stats.increment(config))
    bastion.on('schedule-hourly', () => Stats.save())
    Stats.start()

    return [

        {
            // Command to start it
            command: config.command, 
            // Optional help string for `!command help`
            help,
            restrict: config.restrict,

            // Define how to parse options, otherwise it'll pass the whole string
            options: bastion.parsers.args(["display"]),

            // Core of the command
            resolve: async function(context, option) {
                let {
                    BAR_AMOUNT=25, 
                    DATE_FORMAT="ddd MM/DD hh:mm a", 
                    stats
                } = await this.getFormat(option)

                let msg = stats.map( n => {
                    let m = moment(n.timestamp);
                    let x = Math.ceil( n.count / BAR_AMOUNT );
                    let chart = new Array(x + 1).join( "■" );
                    let count = Math.round(n.count);
                    let display = `[${chart}] ${count}`;
                    if (!chart.length) {
                        display = `[] ${count}`;
                    }
                    return `${m.format(DATE_FORMAT)} ${display}`;
                }).join("\n")

                return bastion.helpers.code(msg, "ini")
            },

            // Create methods for the route to clean up your resolve
            // Can be referenced in resolve with this.doSomething()
            methods: {
                getFormat: async function(option) {
                    let stats = []
                    switch(option) {
                        case "daily":
                            stats = await Stats.getDailyHistory()
                            return {
                                BAR_AMOUNT: 100,
                                DATE_FORMAT: "ddd MM/DD",
                                stats
                            }
                        case "average":
                            stats = await Stats.getAverageHistory()
                            return {
                                DATE_FORMAT: "hh:mm a",
                                stats
                            }
                        default:
                            stats = await Stats.getHistory(48)
                            return { stats }
                    }
                }
            }
        }

    ]
}