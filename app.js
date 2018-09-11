import dotenv from 'dotenv'
dotenv.config()

import Bastion from './lib/bastion'
import botModules from './config/plugins.config'
import Boombot from './plugins/Boombot'

const channels = {
    "admin": "430517752546197509",
    "general-2": "466328017342431233",
    "strava": "430517752546197509",
    "boombot": "432766496700235776",
    "stocks": "363123179696422916",
    "announcement": "430878436027006978",
    "compact": "464561717821702144",
}

const bastion = Bastion({
    token: process.env.DISCORD_TOKEN,
    channels,
    serverId: "358442034790400000",
    prefix: process.env.NODE_ENV === "production" ? "!" : "_"
})

if (process.env.NODE_ENV === "admin") {
    bastion.channels.restrict( channels.admin )
}
    
// Load modules
bastion.use(botModules(bastion), { ignore: [channels.boombot] })
bastion.use(Boombot(bastion, {
    restrict: [channels.boombot, channels.admin]
}))

bastion.connect()