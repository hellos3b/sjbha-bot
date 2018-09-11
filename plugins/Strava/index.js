/**
 *  Let people subscribe/unsubscribe from taggable roles
 * 
 */

import deepmerge from 'deepmerge'
import chalk from 'chalk'

import Auth from './Auth'
import Webhook from './webhook'
import utils from './utils'
import Api from './api'
import levels from './levels'
import Table from 'ascii-table'

const baseConfig = {
    command: "strava",
    apiUrl: '/api/strava',
    restrict: []
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const cmd = bastion.command(config.command)
    const help = bastion.helpers.code(
        `< ${cmd} auth > Authenticate the bot to your strava account\n`+
        `< ${cmd} stats @user > View strava stats\n` +
        `< ${cmd} level > View your XP and Level\n` +
        `< ${cmd} levels > See everybody's level\n` +
        `< ${cmd} leaders > View who ran the most in the last 4 weeks\n` +
        `< ${cmd} calendar > View your 4 weeks calendar\n` +
        `< ${cmd} avg > View your 4 weeks average stats\n`,
    "md")
    const q = new bastion.Queries('strava')
    const auth = Auth(bastion)
    const api = Api(bastion)

    const webhook = new Webhook()

    bastion.app.use(config.apiUrl, auth.router())
    bastion.app.use(config.apiUrl, webhook.router())

    webhook.on('activity', async (data) => {
        const details = await api.addActivity(data)
        const msg = api.getActivityString(details)
        bastion.send(bastion.channels.strava, msg)
    })

    return [

        // Router
        {
            command: config.command,
            restrict: config.restrict,
            help,
            helpOnEmpty: true,
            options: bastion.parsers.args(["cmd", "@target"]),

            resolve: async function(context, cmd) {
                this.route(cmd)
            }
        },

        // Authorize a user's strava account
        {
            action: `${config.command}:auth`,

            resolve: async function(context) {
                bastion.bot.simulateTyping(context.channelID)
                const url = auth.createAuthUrl(userID, user, config.apiUrl)
                await this.send(context.userID, `Hello! To auth the discord bot to post your strava times, just click on this link and accept the authorization\n${url}`)

                return `DM'd you your authorization link!`
            }
        },

        // View an overview of stats
        {
            action: `${config.command}:stats`,
            resolve: async function(context, cmd, target) {
                bastion.bot.simulateTyping(context.channelID)
                const stats = await api.getStats(target)
                if (!stats) return "This person has not authenticated with Strava!"

                const runs = stats.recent_run_totals
                const distance = utils.getMiles(runs.distance)
                const time = utils.hhmmss(runs.moving_time, true)
                
                return `${stats.username} has run ${runs.count} times in the last four weeks; ${distance} mi ${time} time`
            }
        },

        // View stats average (Should probably put this together)
        {
            action: `${config.command}:avg`,
            resolve: async function(context, cmd, target) {
                bastion.bot.simulateTyping(context.channelID)
                const avg = await api.getAverageStats(target)
                if (!avg) return "This person has not authenticated with Strava!"

                return `**${avg.username}** last four weeks average: ${avg.total} runs,  ${avg.distance} mi, ${avg.pace}/mi pace`
            }
        },

        // Let a user check their own level
        {
            action: `${config.command}:level`,
            resolve: async function(context, cmd, target) {
                bastion.bot.simulateTyping(context.channelID)
                const user = await api.getUser(target)
                if (!user) return "This person has not authenticated with Strava!"

                const bar = levels.XPBar(user.EXP)

                return bastion.helpers.code(
                    `${user.user}\n`+
                    `Lvl ${user.level}\n` +
                    `XP: ${user.EXP}/${levels.LEVEL_EXP}\n`+
                    `${bar}`, 
                "ini")
            }
        },

        // leaderboard for levels
        {
            action: `${config.command}:levels`,
            resolve: async function(context) {
                bastion.bot.simulateTyping(context.channelID)
                const leaderboard = await api.leaderboardLevels()

                // create table
                var table = new Table("Levels")
                table.removeBorder()
    
                leaderboard.forEach( entry => {
                    const bar = levels.XPBar(entry.EXP, 12)
                    table.addRow( 
                        entry.user,
                        `lvl ${entry.level}`, 
                        `${bar}`,
                        `${entry.EXP}XP`
                    )
                })

                return bastion.helpers.code(table.toString(), "ini")
            }
        },

        {
            action: `${config.command}:leaders`,
            options: ["cmd", "type"],
            resolve: async function(context, cmd, type) {
                bastion.bot.simulateTyping(context.channelID)
                const { sorter, order } = this.getSortfn(type)

                const leaderboard = await api.leaderboard()
                const sorted = leaderboard.sort(sorter)

                var table = new Table("Past 4 Week Leaders");
                table.removeBorder();
    
                leaderboard.forEach( (entry, i) => {
                    let stats = {
                        distance: `${entry.distance} mi`, 
                        time: entry.time, 
                        pace: `${entry.pace}/mi`
                    }
    
                    table.addRow(
                        `${i+1}.`, 
                        entry.user, 
                        stats[order[0]],
                        stats[order[1]],
                        stats[order[2]],
                        "[" + entry.total + " runs]"
                    )
                })

                return bastion.helpers.code(table.toString(), "ini")
            },

            methods: {
                getSortfn(type) {
                    let sorter = (entry) => entry.moving_time
                    let order = ["time", "distance", "pace"]
        
                    if (type === "distance") {
                        sorter = (entry) => entry.distance
                        order = ["distance", "time", "pace"]
                    } else if (type === "pace") {
                        sorter = (entry) => entry.pace_seconds
                        order = ["pace", "distance", "time"]
                    }

                    return {
                        sorter, order
                    }
                }
            }
        },

        // leaderboard for levels
        {
            action: `${config.command}:calendar`,
            resolve: async function(context, cmd, target) {
                bastion.bot.simulateTyping(context.channelID)

                const start_date = new Date()
                start_date.setDate(start_date.getDate() - 28)
                start_date.setDate(start_date.getDate() - start_date.getDay())
        
                const user = await api.getUser(target)
                if (!user) return "This person has not authenticated with Strava!"

                const activities = await api.getActivities(user, start_date)
                const calendar = utils.calendar(user, activities, start_date)

                return bastion.helpers.code(calendar)
            }
        },

    ]
}