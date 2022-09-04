import deepmerge from 'deepmerge'
import ask from './ask'

const baseConfig = {
    queryTimeout: 5 * 60 * 1000
}

export default function (bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)

    bastion.extend("Ask", (...opt) => {
        const args = [bastion, config, ...opt]
        return ask.Ask.apply(ask, args)
    })
    bastion.on("message", ask.Test)

    return []
}