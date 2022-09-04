/**
 *  Use this as the base template for a new command
 * 
 */

import './schema'

import * as path from 'path'

import deepmerge from 'deepmerge'
import express from 'express'
import moment from 'moment'

const baseConfig = {
    command: "",
    restrict: []
}

let dbCache = {}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const q = new bastion.Queries('ModeloVirus')
    const log = bastion.Logger("ModeloVirus").log

    bastion.app.use('/discord-tag', express.static(path.join(__dirname, 'ui')))

    q.getAll()
      .then( r => {
        r.forEach( (infection, idx) => {
          infection.patientnum = idx
          dbCache[infection.userID] = infection
        })
      })

    return [
      {
        command: 'tag',

        resolve: async function(context, option) {
          const data = dbCache[context.userID]
          if (!data) return "You weren't tagged, congratulation!"

          let prev = dbCache[data.infectedByID];
          let chain = []
          while (prev) {
            chain.push(prev)
            prev = dbCache[prev.infectedByID]
          }

          const chainString = chain
            .map(n => n.user)
            .reverse()
            .join(" → ")
          
          const a = moment(dbCache['395275539444793344'].timestamp)
          const b = moment(data.timestamp)
          const diff = b.diff(a, 'hours')

          return  `\`TAG #${data.patientnum} (+${diff} HOURS)\`` 
            + '\n' + chainString + ` → **${context.user}**`
            + `\n\`MESSAGE:\` ${bastion.bot.fixMessage(data.message)}`
        }
      }
    ]
}