import dotenv from 'dotenv'
dotenv.config()

import Bastion from './lib/bastion'
import botModules from './config/plugins.config'
import Boombot from './plugins/Boombot'

const channels = {
    "admin": "430517752546197509",
    "shitpost": "506911331257942027",
    "strava": "450913008323919872",
    "boombot": "432766496700235776",
    "stocks": "363123179696422916",
    "dungeon": "497505757865050112",
    "announcement": (process.env.NODE_ENV === 'production' ) ? "430878436027006978" : "487730873278398475",
    "compact": (process.env.NODE_ENV === 'production') ? "464561717821702144" : "488850092045107202"
}

const bastion = Bastion({
    token: process.env.DISCORD_TOKEN,
    channels,
    serverId: "358442034790400000",
    prefix: process.env.NODE_ENV === "production" ? "!" : "_"
})
    
// Load modules
bastion.use(botModules(bastion), { ignore: [channels.boombot] })
bastion.use(Boombot(bastion, {
    restrict: [channels.boombot, channels.admin]
}))

bastion.connect()