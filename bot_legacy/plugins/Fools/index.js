import deepmerge from 'deepmerge'
import chalk from 'chalk'
import Ducks from './Duck'
import './schema'
import './shotSchema'

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
        "359573690033242119",
        "506911331257942027"
    ]
}

const emojis = {
    "Pink Bombers": "<:pinkbombers:470323192943214607>",
    "Green Mafia": "<:greenmafia:470323210508959744>",
    "Resistance": "<:resistance:470323234256977941>",
    "Guardians": "<:guardians:521791585541816326>",
    "Uprising": "<:uprising:521791567598583839>"
}

const FIVE_MINUTES = 1000 * 60 * 5

const THIRTY_MINUTES = 1000 * 60 * 30
const SIXTY_MINUTES = 1000 * 60 * 60

let nextDuck = {
    start: 0,
    end: 0
}

let isActive = false
let activeTrack = {}

let timeout = null

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const qShot = new bastion.Queries("FoolsShot")
    const teams = new bastion.Queries('TeamSchema')

    let isStillOngoing = true

    function startTrack() {
        isActive = true
        activeTrack = {}

        for (var i = 0; i < config.channels.length; i++) {
            activeTrack[config.channels[i]] = 1
        }

        setTimeout(() => {
            sendDuck()
        }, FIVE_MINUTES)
    }

    bastion.on('message', (context) => {
        if (context.message.includes("🦆")) {
            const msg_id = context.evt.d.id
            
            bastion.bot.deleteMessage({
                channelID: context.channelID,
                messageID: msg_id
            })
            return;
        }

        if (!isActive) return;
        if (!activeTrack[context.channelID]) return;

        activeTrack[context.channelID]++
    })

    async function sendDuck() {
        console.log("activeTrack", activeTrack)
        let activeChannels = Object.entries(activeTrack)
            .map( ([k,v]) => ({ id: k, count: v }))
            .sort( (a,b) => {
                if (a.count > b.count) return -1
                if (a.count < b.count) return 1
                else return 0
            })
            .filter(n => n.count > 1)
            .slice(0, 3)

        console.log("ACTIVE CHANNELS", activeChannels)

        if (!activeChannels.length) {
            activeChannels = Object.entries(activeTrack).map( ([k,v]) => ({ id: k, count: v }))
        }

        isActive = false
        activeTrack = {}

        const i = Math.floor(Math.random()*activeChannels.length)
        const id = activeChannels[i].id

        const msg = await bastion.send(id, "🦃")
        Ducks.create(id, msg.id)
    }
    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function startTimeout() {
        if (!isStillOngoing) return;
        const time = getRandomInt(THIRTY_MINUTES, SIXTY_MINUTES)
        const d = new Date().getTime()

        nextDuck = {
            start: new Date(d + THIRTY_MINUTES),
            end: new Date(d + SIXTY_MINUTES)
        }

        if (timeout) {
            clearTimeout(timeout)
        }
        
        timeout = setTimeout(() => {
            startTrack()
        }, time)
    }

    Ducks.onDone(duck => {
        let shotTeams = duck.shots.map(n => n.team)
        let msg = `🍗 ` + shotTeams.map(t => emojis[t]).join(' ')
        bastion.bot.editMessage({
            channelID: duck.channelID,
            messageID: duck.msgId,
            message: msg
        })
    })

    bastion.schedule('30 8 1 4 *', () => {
        startTimeout()
    })

    bastion.schedule('59 23 1 4 *', () => {
        isStillOngoing = false;
    })

    return [

        // {
        //     command: 'bird',

        //     resolve: async function(context, tag) {  
        //         const msg = await bastion.send(context.channelID, "🦃")
        //         Ducks.create(context.channelID, msg.id)
        //         // sendDuck()
        //     }
        // },

        {
            command: 'team',

            resolve: async function(context) {
                const shots = await qShot.find()
                const points = {}
                for (var k in emojis) {
                    points[k] = 0
                }
                
                console.log("SHOTS", shots)
                shots.map( (shot) => {
                    for (var i = 0; i < shot.shots.length; i++) {
                        const t = shot.shots[i].team
                        points[t] += 1
                    }
                })

                let msg = 'TEAM HUNT\n'
                for (var k in points) {
                    msg += `${k.padEnd(16)} ${points[k]}\n`
                }
                return bastion.helpers.code(msg)
            }
        },

        {
            command: "bang",

            resolve: async function(context, tag) {
                const msg_id = context.evt.d.id

                await bastion.bot.deleteMessage({
                    channelID: context.channelID,
                    messageID: msg_id
                })

                const userTeam = await teams.findOne({userID: context.userID})
                if (!userTeam) return;

                const duck = Ducks.bang(bastion, context.channelID, context.userID, context.user, userTeam.team)
                if (!duck) return;

                const emoji = emojis[userTeam.team]

                const time = this.getSecondsMinutes(duck.shotTime)
                let shotTeams = duck.shots.map(n => n.team)
                let msg = `🦃💥 ` + shotTeams.map(t => emojis[t]).join(' ')

                await bastion.bot.editMessage({
                    channelID: context.channelID,
                    messageID: duck.msgId,
                    message: msg
                })

                startTimeout()
            },

            methods: {
                getSecondsMinutes(shotTime) {
                    let time = shotTime / 1000
                    time = Math.floor(time * 10) / 10
    
                    if (time < 60) {
                        return time + "s"
                    }

                    time = Math.floor(time / 60)
                    return time + "m"
                }
            }
        }

    ]
}