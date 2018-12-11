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
        },
        {
            name: "Observers",
            roleId: "521592522796171274"
        },
        {
            name: "Guardians",
            roleId: "521592460728598528"
        },
        {
            name: "Uprising",
            roleId: "521592718783283200"
        }
    ]
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const q = new bastion.Queries('TeamSchema')
    const log = bastion.Logger("Teams").log
    const points = Points(bastion, config.points)

    function removeRoles(userID) {
        const promises = config.teams.map( t => {
            return bastion.bot.removeFromRole({
                serverID: bastion.config.serverId,
                roleID: t.roleId,
                userID
            })
        })
        return Promise.all(promises)
    }

    return [

        {
            command: "team",
            
            options: bastion.parsers.args(["cmd"]),

            resolve: async function(context, cmd) {
                if (cmd === "resist") return this.route("resist")
                if (cmd === "observers") return this.route("observe")
                if (cmd === "guardians") return this.route("guardian")
                if (cmd === "uprising") return this.route("uprising")
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
                if (user.team === 'Uprising') return `You can't resist the Resistance's Resistance`
                if (user.team === 'Guardians') return `You can't resist`
                if (user.team === 'Observers') return `You can't resist`

                // If failed to resist
                if (user.resist) return `You've already failed to resist, *traitor*`
                if (user.guardian) return `You tried to be a hero and join the Guardians, now you're not welcomed to the Resistance`

                return user
            },

            resolve: async function(context, user) {
                const rng = Math.random() < 0.5

                user.resist = true

                if (rng) {
                    user.oldTeam = user.team
                    user.team = "Resistance"

                    await removeRoles(context.userID)
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
            }
        },

        // Observers
        {
            action: "team:observe", 

            validate: async function(context) {
                const user = await q.findOne({userID: context.userID})

                // If they aren't on a team yet
                if (!user) return `You have to have joined a team in order to join the Observers`

                // if already on resistance
                if (user.team === 'Resistance') return `You can't join observers from Resistance`
                if (user.team === 'Uprising') return `You can't join observers from Uprising`
                if (user.team === 'Observers') return `You're already on the Observers`

                return user
            },

            resolve: async function(context, user) {

                user.resist = true

                user.oldTeam = user.team
                user.team = "Observers"

                await removeRoles(context.userID)
                const resistance = config.teams.find( n => n.name === "Observers")
                bastion.bot.addToRole({
                    serverID: bastion.config.serverId,
                    userID: context.userID,
                    roleID: resistance.roleId
                })
                this.send(context.channelID, "⛑ Welcome to the Observers")

                user.save()
            }
        },

        // Guardian
        {
            action: "team:guardian", 

            validate: async function(context) {
                const user = await q.findOne({userID: context.userID})

                // If they aren't on a team yet
                if (!user) return `You have to have joined a team in order to join the Guardians`

                // if already on resistance
                if (user.team === 'Resistance') return `The Resistance isn't welcome to the Guardians`
                if (user.team === 'Uprising') return `The Uprising isn't welcome to the Guardians`
                if (user.team === 'Observers') return `You can't join the Guardians`
                if (user.team === 'Guardians') return `You are already on the Guardians`

                if (user.resist) return `The Guardians don't accept resistors`

                // If failed to guardian
                if (user.guardian) return `You tried out for the Guardians, but were found not fit`

                return user
            },

            resolve: async function(context, user) {
                const rng = Math.random() < 0.5

                user.guardian = true

                if (rng) {
                    user.oldTeam = user.team
                    user.team = "Guardians"

                    await removeRoles(context.userID)
                    const resistance = config.teams.find( n => n.name === "Guardians")
                    bastion.bot.addToRole({
                        serverID: bastion.config.serverId,
                        userID: context.userID,
                        roleID: resistance.roleId
                    })
                    this.send(context.channelID, "⚔ Welcome to the Guardians")
                } else {
                    this.send(context.channelID, "🚫 You tried out for the Guardians, but were found not fit")
                }

                user.save()
            }
        },

        // Uprising
        {
            action: "team:uprising", 

            validate: async function(context) {
                const user = await q.findOne({userID: context.userID})

                // If they aren't on a team yet
                if (!user) return `You have to have joined a team in order to join the Guardians`

                // if already on resistance
                if (user.team === 'Uprising') return `You're already in the Uprising`
                if (user.team === 'Observers') return `You can't join the Uprising`
                if (user.team === 'Guardians') return `The Uprising doesn't accept Guardians`

                if (!user.resist) return `The Uprising is only for people who tried to resist`

                if (user.uprising) return `You've already tried joining the Uprising, they said no`

                // If failed to guardian
                if (user.guardian) return `The Uprising doesn't accept anyone who tried to join the Guardians`

                return user
            },

            resolve: async function(context, user) {
                const rng = Math.random() < 0.5

                user.uprising = true

                if (rng) {
                    user.oldTeam = user.team
                    user.team = "Uprising"

                    await removeRoles(context.userID)
                    const resistance = config.teams.find( n => n.name === "Uprising")
                    bastion.bot.addToRole({
                        serverID: bastion.config.serverId,
                        userID: context.userID,
                        roleID: resistance.roleId
                    })
                    this.send(context.channelID, "✊ Welcome to the Uprising")
                } else {
                    this.send(context.channelID, "🚫 The Uprising does not welcome you")
                }

                user.save()
            }
        },

        // List
        {
            action: "team:list", 

            restrict: config.listRestrict,

            resolve: async function(context, user) {
                let teams = await q.getAll()

                teams = teams.filter( n => !n.pruned )
                
                this.type()

                const p = await points.getRSVPs(teams)
                const grouped = _.groupBy(p, "team")
                const msg = this.createOutput(grouped) 


                return bastion.helpers.code(msg, 'md')
            },

            methods: {
                createOutput(groupedTeams) {
                    let msg = "Legend: \n† Denied by Resistance\n⧪ Unfit for Guardian\n± Captian in Uprising\n⦰ Rejected by Uprising\n\n"

                    for (var k in groupedTeams) {
                        const points = groupedTeams[k]
                            .reduce( (res, person) => {
                                let points = person.points
                                if (person.team === "Guardians") {
                                    points *= 2
                                }
                                if (person.team === "Uprising" && person.oldTeam === "Resistance") {
                                    points *= 2
                                }
                                return res + points
                            }, 0)

                        const users = groupedTeams[k]
                            .sort( (a,b) => a.points < b.points ? 1 : -1)
                            .map( n => {
                                let pre = "  "

                                if (n.resist) {
                                    if (n.team !== "Resistance" && n.team !== "Observers" && n.team !== "Uprising") {
                                            pre = "† "
                                    }
                                }

                                if (n.uprising) {
                                    if (n.team !== "Uprising" && n.team !== "Observers") {
                                        pre = "⦰ " 
                                    }
                                }

                                if (n.team === "Uprising" && n.oldTeam === "Resistance") {
                                    pre = "± "
                                }

                                if (n.guardian) {
                                    if (n.team !== "Guardians") {
                                        pre = "⧪ " 
                                    }
                                }

                                let pts = (n.points || "").toString().padEnd(3)

                                if (n.team === "Observers") {
                                    pts = "".padEnd(3)
                                }
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