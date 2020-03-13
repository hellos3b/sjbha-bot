/**
 *  Use this as the base template for a new command
 * 
 */

import './Schema'

import deepmerge from 'deepmerge'

// import router from './ui/router'

const baseConfig = {
    command: "outbreak",
    restrict: []
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const q = new bastion.Queries('ModeloVirus')
    const log = bastion.Logger("ModeloVirus").log

    bastion.on('message', checkInfection)

    async function checkInfection(context) {
      const mentions = context.evt.d.mentions
      if (!mentions.length) return;

      const infections = await q.getAll();

      if (infections.find(n => n.userID === context.userID)) return;

      for (var i = 0; i < mentions.length; i++) {
        // If no infections, first to mention s3b gets it
        if (!infections.length && mentions[i].id === '125829654421438464') {
          return infectUser(context, "125829654421438464", "s3b")
        }

        // If user mentions someone who's infected they get it
        const inf = infections.find(n => n.userID === mentions[i].id)

        if (!inf) continue;

        // Infected!
        return infectUser(context, mentions[i].id, mentions[i].username)
      }
    }

    async function infectUser(context, fromId, fromName) {

      const payload = {
        user: context.user,
        userID: context.userID,
        infectedBy: fromName,
        infectedByID: fromId,
        message: context.message
      }
      
      // Infected!
      await q.create(payload)
    }

    return []
}