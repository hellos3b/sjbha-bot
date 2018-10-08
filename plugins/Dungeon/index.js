import deepmerge from 'deepmerge'
import chalk from 'chalk'

// Game stuff
import Grid from './game/grid'
import GenerateWorld from './game/generateWorld'

const baseConfig = {}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)

    return [

        {
            command: 'dungeon',

            resolve: async function(context, tag) {  
                let grid = new Grid(10, 10)
                grid = GenerateWorld(grid, 20, 5)

                return bastion.helpers.code(grid.toString())
            }
        }

    ]
}