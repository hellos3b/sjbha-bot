/**
 *  Use this as the base template for a new command
 * 
 */

import deepmerge from 'deepmerge'
import download from 'image-downloader'

const baseConfig = {
    command: "chart",
    restrict: null
}


export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const cmd = bastion.command(config.command)
    const help = `${cmd} stock`

    return [

        {
            // Command to start it
            command: config.command, 
            // Optional help string for `!command help`
            help,
            // Show help string with empty `!command` (in case parameters are required)
            helpOnEmpty: true,
            // Restrict command to a channel, will show error if not defined in config
            restrict: config.restrict, 
            // Define how to parse options, otherwise it'll pass the whole string
            options: bastion.parsers.args(["symbol", "style"]),

            // Core of the command
            resolve: async function(context, symbol, optStyle) {
                const style = optStyle === "line" ? "l" : "c"

                let options = {
                    url: `https://finviz.com/chart.ashx?t=${symbol}&ty=${style}&ta=0&p=d&s=l`,
                    dest: `${__dirname}/chart.png`
                }

                if (symbol.startsWith('/')) {
                    symbol = symbol.substr(1)

                    options = {
                        url: `https://elite.finviz.com/fut_chart.ashx?t=${symbol}&p=m5&f=1`, 
                        dest: `${__dirname}/chart.png`
                    }
                }

                bastion.bot.simulateTyping(context.channelID)

                try {
                    const file = await download.image(options)
                    
                    if (file.image.length === 0) return `Could not find "${symbol}"`

                    bastion.bot.uploadFile({
                        to: context.channelID,
                        file: options.dest
                    })
                } catch(err) {
                    this.send(context.channelID, "Something went wrong trying to get the chart")
                }
            }
        }

    ]
}