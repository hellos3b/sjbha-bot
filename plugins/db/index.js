/**
 *  Use this as the base template for a new command
 * 
 */

import deepmerge from 'deepmerge'
import db from './db'
import Queries from './Queries'

const baseConfig = {
    mongoUrl: ""
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)

    bastion.on('ready', () => db.connect(config))
    bastion.extend("Queries", Queries)

    return []
}