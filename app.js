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
    "announcement": process.env.C_ANNOUNCEMENT,
    "compact": process.env.C_COMPACT
}

const bastion = Bastion({
    token: process.env.DISCORD_TOKEN,
    channels,
    serverId: process.env.SERVER_ID,
    prefix: process.env.NODE_ENV === "production" ? "!" : (process.env.npm_config_symbol || "_")
})
    
// Load modules
bastion.use(botModules(bastion), { ignore: [channels.boombot] })
bastion.use(Boombot(bastion, {
    restrict: [channels.boombot]
}))

bastion.connect()