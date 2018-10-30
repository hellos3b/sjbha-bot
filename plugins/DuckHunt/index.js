import deepmerge from 'deepmerge'
import chalk from 'chalk'
import Ducks from './Duck'
import './schema'

const baseConfig = {
    channels: [
        "358442034790400001",
        "466328017342431233",
        "358442118928400384",
        "358527683337912320",
        "358916551744946177",
        "366820414820843522",
        "358921562658701322",
        "417871633768775693",
        "375143658128932864",
        "483859948850118678",
        "420997471741935617",
        "361192235146018826",
        "464301806533738496",
        "377347268430528522",
        "416525963464146944",
        "429459189824487463",
        "358921536071139330",
        "363123179696422916",
        "376901773656326144",
        "376901773656326144",
        "450913008323919872",
        "420136050065801227",
        "359573690033242119"
    ]
}

const SIX_HOURS = 1000 * 60 * 60 * 6
const EIGHTEEN_HOURS = 1000 * 60 * 60 * 18

let timeout = null

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const q = new bastion.Queries("Duckhunt")

    async function saveBang(user, userID) {
        let player = await q.findOne({ userID })
        if (!player) {
            q.create({
                user, userID,
                count: 1
            })
        } else {
            player.count++
            q.update({ userID }, player)
        }
    }

    async function sendDuck() {
        const i = Math.floor(Math.random()*config.channels.length)
        const id = config.channels[i]
        const msg = await bastion.send(id, "\:duck:")
        Ducks.create(id, msg.id)
    }
    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function startTimeout() {
        const time = getRandomInt(SIX_HOURS, EIGHTEEN_HOURS)

        timeout = setTimeout(() => {
            sendDuck()
        }, time)
    }

    startTimeout()

    return [

        {
            command: 'duck',

            resolve: async function(context, tag) {  
                const msg = await bastion.send(context.channelID, "\:duck:")
                Ducks.create(context.channelID, msg.id)
                // sendDuck()
            }
        },

        {
            command: 'duckhunt',

            options: bastion.parsers.args(["tag"]),

            resolve: async function(context, tag) {  
                if (tag === "all") return this.route("all")

                const user = await q.findOne({ userID: context.userID })
                if (!user) return `You haven't shot any ducks, keep looking!`

                return `Count: **${user.count}**`
            }
        },

        {
            action: 'duckhunt:all',

            resolve: async function(context, tag) {  
                const counter = function(val) {
                    if (val < 10) return '0' + val
                    else return val
                }
                const players = await q.getAll()
                const msg = players
                    .sort( (a, b) => {
                        if (a.count > b.count) {
                            return -1
                        } else if (a.count < b.count) {
                            return 1
                        } else {
                            return 0
                        }
                    }).map( p => {
                        return counter(p.count) + ' ' + p.user
                    }).join("\n")
                return "Duck Hunt leaderboard: \n" + bastion.helpers.code(msg)
            }
        },

        {
            command: "bang",

            resolve: async function(context, tag) {
                const id = Ducks.bang(context.channelID)
                if (!id) return;

                await bastion.bot.editMessage({
                    channelID: context.channelID,
                    messageID: id,
                    message: `*duck shot by ${context.user}*`
                })

                const msg_id = context.evt.d.id

                await bastion.bot.deleteMessage({
                    channelID: context.channelID,
                    messageID: msg_id
                })

                saveBang(context.user, context.userID)
            }
        }

    ]
}