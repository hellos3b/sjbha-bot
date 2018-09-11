import deepmerge from 'deepmerge'
import boombot from './boombot/router'

const baseConfig = {
    restrict: ""
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    
    bastion.on("message", function(context) {
        if (config.restrict.indexOf(context.channelID) > -1) {
            boombot.router(context)
        }
    })
}