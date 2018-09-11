/**
 *  Use this as the base template for a new command
 * 
 */

import deepmerge from 'deepmerge'
import './Schema'
import _ from 'lodash'
import Points from './points'

const baseConfig = {
    listRestrict: [],
    points: {
        yes: 3,
        maybe: 0,
        startDate: "9/1/2018"
    },
    teams: [
        {
            name: "Pink Bombers",
            roleId: "466368518049497088",
            initial: true
        },
        {
            name: "Green Mafia",
            roleId: "466368570532560897",
            initial: true
        },
        {
            name: "Resistance",
            roleId: "470114559911526402"
        }
    ]
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const q = new bastion.Queries('TeamSchema')
    const log = bastion.Logger("Teams").log
    const points = Points(bastion, config.points)

    return [

        {
            command: "team",
            
            options: bastion.parsers.args(["cmd"]),

            resolve: async function(context, cmd) {
                if (cmd === "resist") return this.route("resist")
                if (cmd === "list") return this.route("list")
                return this.route("assign")
            }
        },

        // Assign
        {
            action: "team:assign", 

            validate: async function(context) {
                const user = await q.findOne({userID: context.userID})

                // If they aren't on a team yet
                if (user) return `You are on team ${user.team}`

                return user
            },

            resolve: async function(context, user) {
                const initialTeams = config.teams.filter( n => n.initial)
                const rng = Math.floor(Math.random()*initialTeams.length)
                const t = initialTeams[rng]

                this.type()

                log(`Adding user ${context.user} to team ${t.name}`)
                await q.create({ userID: context.userID, user: context.user, team: t.name })

                await bastion.addRole(context.userID, t.roleId)

                return `Congratulations, you have been recruited to team **${t.name}**!`
            }
        },

        // Resist
        {
            action: "team:resist", 

            validate: async function(context) {
                const user = await q.findOne({userID: context.userID})

                // If they aren't on a team yet
                if (!user) return `You have to have joined a team in order to resist`

                // if already on resistance
                if (user.team === 'Resistance') return `You're already a part of the Resistance!`

                // If failed to resist
                if (user.resist) return `You've already failed to resist, *traitor*`

                return user
            },

            resolve: async function(context, user) {
                const rng = Math.random() < 0.5

                user.resist = true

                if (rng) {
                    user.oldTeam = user.team
                    user.team = "Resistance"

                    await this.removeRoles(context.userID)
                    const resistance = config.teams.find( n => n.name === "Resistance")
                    bastion.bot.addToRole({
                        serverID: bastion.config.serverId,
                        userID: context.userID,
                        roleID: resistance.roleId
                    })
                    this.send(context.channelID, "💀 Welcome to the Resistance")
                } else {
                    this.send(context.channelID, "🚫 The Resistance does not welcome you")
                }

                user.save()
            },

            methods: {
                removeRoles: async function(userID) {
                    const promises = config.teams.map( t => {
                        return bastion.bot.removeFromRole({
                            serverID: bastion.config.serverId,
                            roleID: t.roleId,
                            userID
                        })
                    })
                    return Promise.all(promises)
                }
            }
        },

        // List
        {
            action: "team:list", 

            restrict: config.listRestrict,

            resolve: async function(context, user) {
                const teams = await q.getAll()
                
                this.type()

                const p = await points.getRSVPs(teams)
                const grouped = _.groupBy(p, "team")
                const msg = this.createOutput(grouped) 


                return bastion.helpers.code(msg, 'md')
            },

            methods: {
                createOutput(groupedTeams) {
                    let msg = ""

                    for (var k in groupedTeams) {
                        const points = groupedTeams[k]
                            .reduce( (res, person) => {
                                return res + person.points
                            }, 0)

                        const users = groupedTeams[k]
                            .sort( (a,b) => a.points < b.points ? 1 : -1)
                            .map( n => {
                                const pre = (n.resist && n.team !== "Resistance") ? "x " : "  "
                                const pts = (n.points || "").toString().padEnd(3)
                                return pts + pre + n.user
                            }).join("\n")

                        msg += `Team ${k} [${points}]\n` +
                                `---------------\n` +
                                users +
                                `\n\n`
                    }

                    return msg
                }
            }
        },

    ]
}