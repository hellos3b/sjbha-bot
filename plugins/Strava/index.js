/**
 *  Let people subscribe/unsubscribe from taggable roles
 * 
 */

import deepmerge from 'deepmerge'

import Auth from './Auth'
import Webhook from './webhook'
import utils from './utils'
import Api from './api'
import levels from './levels'
import Table from 'ascii-table'
import challenges from './challenges'

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
        `< ${cmd} leaders > View who ran the most in the last 4 weeks\n` +
        `< ${cmd} calendar > View your 4 weeks calendar\n` +
        `< ${cmd} avg > View your 4 weeks average stats\n` +
        `< ${cmd} challenges > View this week's challenges\n`,
    "md")

    const q = new bastion.Queries('stravaID')
    const auth = Auth(bastion)
    const api = Api(bastion)

    const webhook = new Webhook()

    bastion.app.use(config.apiUrl, auth.router())
    bastion.app.use(config.apiUrl, webhook.router())

    async function sendRundayMessage() {
        const users = await q.getAll()
        const challengers = users.filter(n => n.challenge)

        let msg = "**<:kudos:477927260826107904> Runday Monday!**\n\nHere's this weeks challenges:\n"
        msg += bastion.helpers.code( utils.challengeTable(challengers), "md") 
        msg += "\n*Good luck!*"

        bastion.send(bastion.channels.strava, msg)
    }

    const delay = ms => new Promise((resolve, reject) => {
        setTimeout(() => resolve(), ms)
    })

    webhook.on('activity', async (data) => {
        // Give candinavian some time to edit the title
        if (data.owner_id === '718741') {
            await delay(5*60*1000); // 5 minutes
        }
        
        const details = await api.addActivity(data)
        if (!details) {
            return
        }

        const msg = api.getActivityString(details)
        
        // for dev
        // bastion.send("430517752546197509", msg)
        bastion.send(bastion.channels.strava, msg)
    })

    bastion.on('schedule-weekly', async () => {
        await api.resetChallenges()
        await api.saveTrends()
        sendRundayMessage()
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
                const url = auth.createAuthUrl(context.userID, context.user, config.apiUrl)
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

        {
            action: `${config.command}:leaders`,
            options: bastion.parsers.args(["cmd", "type"]),
            resolve: async function(context, cmd, type) {
                bastion.bot.simulateTyping(context.channelID)
                const { sorter, order } = this.getSortfn(type)

                const leaderboard = await api.leaderboard()
                const sorted = leaderboard
                    .filter(n => n.total > 0)
                    .sort(sorter)

                var table = new Table("Past 4 Week Leaders");
                table.removeBorder();
    
                sorted.filter(n => n.total > 0)
                    .forEach( (entry, i) => {
                        let stats = {
                            distance: `${entry.distance} mi`, 
                            time: entry.timeStr, 
                            pace: `${entry.paceStr}/mi`
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
                    let sorter = (a, b) => a.distance < b.distance ? 1 : -1
                    let order = ["distance", "time", "pace"]
        
                    if (type === "time") {
                        sorter = (a,b) => a.time < b.time ? 1 : -1
                        order = ["time", "distance", "pace"]
                    } else if (type === "pace") {
                        sorter = (a, b) => a.pace < b.pace ? -1 : 1
                        order = ["pace", "distance", "time"]
                    }

                    return {
                        sorter, order
                    }
                }
            }
        },

        // calendar
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
                if (!activities.length && context.userID === user.userID) {
                    return `You haven't run in the last 4 weeks. Go run, Tubertha!`
                }

                console.log("activities", activities)

                const calendar = utils.calendar(user, activities, start_date)

                return bastion.helpers.code(calendar)
            }
        },

         // View challenge
         {
            action: `${config.command}:challenge`,

            resolve: async function(context, cmd, target) {
                const user = await api.getUserInfo({ userID: target })
                if (!user.challenge) return "You need at least 4 runs in the last month to get a challenge! Keep on' runnin!"

                const output = utils.getChallengeTargetStr(user.challenge.targets)

                const finished = (user.challenge.finished) ? '[👏 DONE]' : ''
                return `${user.challenge.challenge.name} - ${output} ${finished}`
            }
        },

        // set challenges manually
        {
            action: `${config.command}:set-challenge`,

            restrict: ["430517752546197509"],

            resolve: async function(context, cmd, target) {
                await api.resetChallenges()

                return "done"
            }
        },

        // View all challenges
        {
            action: `${config.command}:challenges`,

            resolve: async function(context) {
                const users = await q.getAll()
                const challengers = users.filter(n => n.challenge)

                return bastion.helpers.code( utils.challengeTable(challengers), "md" ) 
            }
        },

        // View trends
        {
            action: `${config.command}:trend`,
            resolve: async function(context, cmd, target) {
                const user = await api.getUserInfo({ userID: target })

                if (!user.averages.length) {
                    return "Maintain a 4 run average to save Trends!\n(You don't have any trends saved)"
                }

                return bastion.helpers.code( utils.averageTable(user.averages), 'md' )
            }
        }

        // {
        //     action: `${config.command}:trend-save`,
        //     resolve: async function(context, cmd, target) {
        //         // const user = await api.getUserInfo({ userID: target })
        //         await api.saveTrend()
        //         // console.log("USER", user)
        //         return 'done'
        //         // return bastion.helpers.code( utils.averageTable(user.averages), 'md' )
        //     }
        // }
    ]
}