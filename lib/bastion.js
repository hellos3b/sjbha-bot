import * as Discord from 'discord.io'

import Channels from './channels'
import DiscordIOPromisify from "./discordio-promisify"
//@ts-ignore
import EventEmitter from 'events'
import Logger from './logger'
import Router from './route'
import Server from './server'
import baseConfig from './config'
import chalk from 'chalk'
import deepmerge from 'deepmerge'
import helpers from './helpers'
import parsers from './parsers'
import schedule from './schedule'
import utils from './utils'

/** @typedef {import('@/types').BastionConfig} BastionConfig */
/** @typedef {import('@/types').Plugin} Plugin */
/** @typedef {import('@/types').PluginOptions} PluginOptions */
/** @typedef {import('@/types').Context} Context */

let bot = null

/** 
 * @class Bastion
 * @property {Function} emit
 */
export class Bastion extends EventEmitter {

    /**
     * @param {BastionConfig} config 
     */
    constructor(config) {
        super()
        console.log("Bastion Constructor")
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

        bot.on('error', err => {
            console.log("Error?", err)
        })
    
        // Captures all messages
        bot.on('message', async (user, userID, channelID, message, evt) => {
            /** @type {Context} */
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

        bot.on('disconnect', function(errMsg, code) { 
            console.log("Bot was disconnected :(");
            console.error("error", errMsg);
            console.log("code:", code);

            this.emit('disconnect');

            if (code == 1000) {
                console.log("-- Reconnecting --")
                bot.connect()
            }
        });


        if (this.config.ui) {
            const port = ( process.env.PORT || 3000 )
            this.app.listen(port, () => console.log(chalk.green("✓"), `UI listening on port ${port}!`))
        }
    }

    /**
     * 
     * @param {Context} context 
     */
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

    /**
     * 
     * @param {(Plugin|Array<Plugin|Function>)} modulesConfig 
     * @param {PluginOptions} opt 
     */
    use(modulesConfig, opt={}) {
        opt.ignore = utils.optionalArray(opt.ignore)
        opt.restrict = utils.optionalArray(opt.restrict)
        /** @type {Array<Plugin|Function>} */
        let configs = utils.optionalArray(modulesConfig)

        configs = configs.map(mod => {
            return (typeof mod === "function") ? mod(this) : mod
        })

        /** @type {Plugin[]} */
        const modules = [].concat.apply([], configs)

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

    /**
     * Helper to prefix a command name with the configurated command prefix
     * @param {string} name 
     * @returns {string} Command with a prefix
     */
    command(name) {
        return this.config.prefix + name;
    }

    /**
     * Send a message to a channel
     * @param {string} channelID 
     * @param {string} message 
     * @returns {Promise}
     */
    send(channelID, message) {
        return bot.sendMessage({
            to: channelID,
            message
        })
    }

    /**
     * Adds a role to a user
     * @param {string} userID 
     * @param {string} roleID 
     */
    addRole(userID, roleID) {
        if (!this.config.serverId) {
            throw new Error("Cannot add role: `serverId` is not defined")
        }
        return bot.addToRole({
            serverID: this.config.serverId,
            userID,
            roleID
        })
    }

    /**
     * Removes a role from a user
     * @param {string} userID 
     * @param {string} roleID 
     */
    removeRole(userID, roleID) {
        if (!this.config.serverId) {
            throw new Error("Cannot add role: `serverId` is not defined")
        }
        return bot.removeFromRole({
            serverID: this.config.serverId,
            userID,
            roleID
        })
    }

    /**
     * Extends bastion and adds a function
     * @param {string} fnName 
     * @param {Function} fn 
     */
    extend(fnName, fn) {
        this[fnName] = fn
        console.log(chalk.green("✓"), chalk.gray(`Loaded plugin`), chalk.blue(`${fnName}`))
    }

    /**
     * Helper to add a cron job to node-cron
     * @param {string} cron 
     * @param {Function} callback 
     */
    schedule(cron, callback) {
        schedule.schedule(cron, callback)
    }
}

/**
 * 
 * @param {BastionConfig} opt 
 * @returns {Bastion}
 */
export default function(opt) {
    return new Bastion(deepmerge(baseConfig, opt))
}

export function Route(command) {
    return new Router(command)
}