import Poll from './Poll'
import deepmerge from 'deepmerge'
import chalk from 'chalk'

const baseConfig = {
    command: "poll",
    reactions: ["🇦", "🇧", "🇨", "🇩"],    // Emotes added as voting reactions
    reactionsText: ["A", "B", "C", "D"],   // text version for the prompt
    timeLimit: 10 * 60 * 1000              // Time limit before printing results
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const cmd = bastion.command(config.command)
    const log = bastion.Logger("Poll").log
    const help = `\`${cmd} Title | Option 1 | Option 2 | Option 3 | Option 4\``

    return [

        {
            command: config.command,
            help,
            options: bastion.parsers.pipe,

            validate(context, [title, ...options]) {
                if (options.length < 2) return "Needs at least two options"
                if (options.length > config.reactions.length) return `Only ${config.reactions.length} options max allowed for a poll`
            },

            resolve: async function(context, [title, ...options]) {  
                log(`Creating poll "${title}" in ${context.channelID}`)

                const poll = new Poll(config, title, options)
                poll.post(context.bot, context.channelID)
                
                setTimeout(() => { poll.announce(context.bot, context.channelID) }, config.timeLimit);
            }
            
        }
    ]
}