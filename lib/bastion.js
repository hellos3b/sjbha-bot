import Discord from 'discord.io'
import chalk from 'chalk'
import DiscordIOPromisify from "./discordio-promisify"
import baseConfig from './config'
import deepmerge from 'deepmerge'
import EventEmitter from 'events'
import Router from './route'
import Channels from './channels'
import Server from './server'
import helpers from './helpers'
import Logger from './logger'
import parsers from './parsers'
import utils from './utils'
import schedule from './schedule'

let bot = null

class Bastion extends EventEmitter {

    constructor(config) {
        super()

        this.config = config
        this.channels = new Channels(this.config.channels)
        this.routes = {}
        this.app = Server.create()
        this.helpers = helpers
        this.Logger = Logger
        this.parsers = parsers
        schedule.init(this)
    }

    connect() {
        bot = this.bot = new Discord.Client({
            token: this.config.token,
            autorun: true
        })

        // Modify bot to use promises
        bot = DiscordIOPromisify(bot)
    
        // Log when ready
        bot.on('ready', evt => {
            console.log(chalk.green("✓"), `Connected to Discord as ${bot.username} [${bot.id}]`)
            this.emit('ready')
        })
    
        // Captures all messages
        bot.on('message', async (user, userID, channelID, message, evt) => {
            let context = { bot, user, userID, channelID, message, evt }

            // if bot ignore self
            if (userID === bot.id) {
                return;
            }

            try {
                this.emit("message", context)
            } catch (error) {
                console.log(chalk.red("Error event this.emit('message')"))
                console.log(error)
            }

            if (message.substring(0, 1) == this.config.prefix) {
                this.router(context)
            }
        })

        if (this.config.ui) {
            const port = ( process.env.PORT || 3000 )
            this.app.listen(port, () => console.log(chalk.green("✓"), `UI listening on port ${port}!`))
        }
    }

    async router(context) {
        const [cmd, ...msg] = context.message.toLowerCase().split(" ")
        console.log(chalk.gray(`<${context.user}>`), chalk.magenta(cmd), msg.join(" "))

        this.emit("command", context, cmd, msg)

        const route = this.routes[cmd]
        if (route) {
            try {
                await route.exec(context)
            } catch (err) {
                console.error(chalk.red(`Problem executing command '${cmd}'`))
                console.error(err)

                this.send(context.channelID, helpers.code(err, 'diff'))
            }
        } else {
            console.log('   ', chalk.gray(`Command '${cmd}' not found, ignoring`))
        }
    }

    // Load in all the plugins and extensions
    use(modules, opt={}) {
        opt.ignore = utils.optionalArray(opt.ignore)
        opt.restrict = utils.optionalArray(opt.restrict)
        modules = utils.optionalArray(modules)

        modules = modules.map( mod => {
            return (typeof mod === "function") ? mod(this) : mod
        })
        modules = [].concat.apply([], modules)

        console.log(`Loading Routes`)
        for (var i = 0; i < modules.length; i++) {
            const route = modules[i]
            route.restrict = [...(route.restrict || []), ...opt.restrict]
            route.ignore = [...(route.ignore || []), ...opt.ignore]

            if (route.requires) {
                const requires = route.requires.filter( mod => !this[mod] )
                if (requires.length) {
                    requires.forEach( name => {
                        console.log(chalk.red("x Couldn't initialize"), chalk.gray(`Command '${route.command || route.action}' requires missing module`),  chalk.blue(name))
                    })
                    break
                }
            }

            if (route.command) {
                const command = this.command(route.command)
                console.log(chalk.green("✓"), chalk.gray(`Using command`),  chalk.magenta(command))
                this.routes[command] = new Router(route, this)
            } else if (route.action) {
                const [cmd, action] = route.action.split(":")
                const command = this.command(cmd)
                if (!this.routes[command]) {
                    console.log(chalk.red(`Action '${action}' does not have a route for it defined ('${command}') `))
                } else {
                    console.log(chalk.blue(">"), chalk.gray(`Attaching action`), chalk.blue(route.action))
                    this.routes[command].addAction(action, route)
                }
            }
        }
    }

    command(name) {
        return this.config.prefix + name;
    }

    send(channelID, message) {
        return bot.sendMessage({
            to: channelID,
            message
        })
    }

    addRole(userID, roleID) {
        return bot.addToRole({
            serverID: this.config.serverId,
            userID,
            roleID
        })
    }

    removeRole(userID, roleID) {
        return bot.removeFromRole({
            serverID: this.config.serverId,
            userID,
            roleID
        })
    }

    extend(fnName, fn) {
        this[fnName] = fn
        console.log(chalk.green("✓"), chalk.gray(`Loaded plugin`), chalk.blue(`${fnName}`))
    }

    schedule(cron, callback) {
        schedule.schedule(cron, callback)
    }

}

export default function(opt) {
    return new Bastion(deepmerge(baseConfig, opt))
}

export function Route(command) {
    return new Router(command)
}