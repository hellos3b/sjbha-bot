import chalk from "chalk"
import utils from './utils'
import { set } from "mongoose";

class Route {

    constructor(opt, bastion) {
        this._actions = {}
        this.opt = opt
        this.bastion = bastion

        for (var k in opt) {
            if (typeof this[k] === 'function') {
                this[k](opt[k], bastion)
            } else {
                this[k] = opt[k]
            }
        }
    }

    _channels(channels, bastion) {
        channels = utils.optionalArray(channels)

        channels = channels.map( c => {
            let id = bastion.channels[c]
            if (!id) {
                return c
            }
            return id
        })
        return new Set(channels)
    }

    ignore(channels, bastion) {
        if (!channels) return

        this.channelsIgnore = this._channels(channels, bastion)
    }

    restrict(channels, bastion) {
        if (!channels) return

        this.channels = this._channels(channels, bastion)
    }

    type(channelID) {
        channelID = channelID || this.context.channelID
        this.bastion.bot.simulateTyping(channelID)
    }

    methods(methods) {
        for (var k in methods) {
            if (this[k]) {
                console.log(chalk.red(`Conflict error! Command ${this.opt.command || this.opt.action} is trying to define a method that already exists ('${k}')`))
                return
            }
            this[k] = methods[k]
        }
    }

    resolve(opt) {
        if (typeof opt === "string") {
            this._exec = async function({ channelID }) {
                this.send(channelID, opt);
            }
        } else {
            this._exec = opt;
        }
    }

    addAction(action, route) {
        if (!route.options) {
            route.options = this.__options
        }
        this._actions[action] = new Route(route, this.bastion)
    }

    options(opt) {
        this.__options = opt
    }

    _options(message, context) {
        let [cmd, ...msg] = message.split(" ")
        msg = msg.join(" ")

        if (msg === "help" || (!msg && this.helpOnEmpty)) {
            return "help"
        }

        if (this.__options) {
            return this.__options(msg, context)
        }

        return [msg]
    }

    validate(validators) {
        this.validators = utils.optionalArray(validators)
    }

    _validate(context, options) {
        if (!this.validators) return

        for (var i = 0; i < this.validators.length; i++) {
            const result = this.validators[i].apply(this, [context, ...options])
            if (result) {
                return result
            }
        }
    }

    help(str) {
        this.helpString = str
        return this
    }

    async route(action) {
        const Action = this._actions[action]
        if (!Action) {
            console.log('   ', chalk.gray(`Couldn't find action '${action}' for '${this.opt.command}'`))
            return
        }

        return Action.exec(this.context)
    }

    async send(channelID, message) {
        return this.bot.sendMessage({
            to: channelID,
            message
        })
    }

    async exec(context) {
        // Check if command is restricted to a channel
        if (this.channels.size) {
            if (!this.channels.has(context.channelID)) {
                console.log(`   `, chalk.magenta(`[${(this.command || this.action)}]`), chalk.gray("Used outside of restricted channels"))
                if (this.restrictMessage) this.send(context.channelID, this.restrictMessage)
                return;
            }
        }

        // Check if this route should ignore a channel
        if (this.channelsIgnore.size) {
            if (this.channelsIgnore.has(context.channelID)) {
                console.log(`   `, chalk.magenta(`[${(this.command || this.action)}]`), chalk.gray("Used inside a channel set to ignore"))
                return;
            }
        }

        this.context = context
        this.bot = context.bot

        // Parse the options. Show help if it exists
        const options = this._options(context.message, context)
        if (options === "help") {
            if (this.helpString) {
                this.send(context.channelID, this.helpString)
            }
            return
        }

        // Run the option validators
        const validateResult = await this._validate(context, options)
        if (typeof validateResult === 'string' || validateResult === false) {
            console.log('   ', chalk.gray(`error:${this.command || this.opt.action}`), validateResult)
            await this.send(context.channelID, validateResult)
            return
        }

        try {
            const args = (validateResult) ? [context, validateResult] : [context, ...options]
            // Execute the command
            const result = await this._exec.apply(this, args)

            // In case they returned a string instead of using this.send directly
            if (typeof result === 'string') {
                await this.send(context.channelID, result)
            }
        } catch (e) {
            console.log('   ', chalk.red(`Command Failed '${this.command || this.opt.action}'`), e)
            await this.send(context.channelID, "```diff\n-"+e+"```")
        }
    }

}

export default Route