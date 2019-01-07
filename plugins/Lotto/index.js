/**
 *  Let people subscribe/unsubscribe from taggable roles
 * 
 */

import deepmerge from 'deepmerge'
import moment from 'moment'
import './Schema'

const baseConfig = {
  command: "lotto",
  listRestrict: [],
  restrict: [],
  cost: 25
}

const delay = ms => 
  new Promise( (resolve, reject) => {
    setTimeout(resolve, ms)
  })

export default function (bastion, opt = {}) {
  const config = deepmerge(baseConfig, opt)

  const q = new bastion.Queries('lotto')
  const rrb = new bastion.Queries('rrbucks')

  return [

    {
      command: config.command,

      restrict: config.restrict,

      resolve: async function (context, message) {
        let user = await rrb.findOne({
          userID: context.userID
        })

        if (!user) {
          return `You need royroybucks to enter the lotto. Use \`!royroybucks\` first`
        }

        const [cmd, ...args] = message.split(" ")

        if (!cmd) return this.route("info")
        if (cmd === 'draw') return this.route("draw")

        const guess = parseInt(cmd)

        if (isNaN(guess)) return `Please pick a valid number from 1-100 for the lotto`
        if (guess < 1 || guess > 100) return `Please pick a valid number from 1-100 for the lotto`
        
        if (user.bucks < config.cost) return `You don't have enough royroybucks to enter the lotto (cost: ${config.cost}, bank: ${user.bucks})`

        const hasGuessed = await q.findOne({userID: context.userID, guess: guess})
        if (hasGuessed) return `You've already picked that number`

        this.type()
        user.bucks -= config.cost

        await rrb.update({userID: user.userID}, user)

        const entry = {
          user: user.user,
          userID: user.userID,
          guess: guess
        }
        await q.create(entry)

        return `Bought ticket for #${guess}`
      }
    },

    {
      action: `${config.command}:info`,

      resolve: async function (context, message) {
        const lotto = await q.find()

        const amt = lotto.length * config.cost

        const picks = lotto.filter( n => n.userID === context.userID )
        const pickMsg = picks.length ? picks.map(n => n.guess).join(", ") : "None"

        return `Current pool: ${amt}rrb\nYour picks: ${pickMsg}`
      }
    },

    {
      action: `${config.command}:draw`,

      resolve: async function (context, message) {
        // Only s3b can draw the lotto
        if (context.userID !== '125829654421438464') return;

        const pick = Math.floor(Math.random()*100) + 1
        const lottoAll = await q.find()
        const pool = lottoAll.length * config.cost
        const lotto = await q.find({ guess: pick })

        bastion.send(context.channelID, "Today's lotto pick is.... *drum roll*")
        await delay(4000)

        let result = bastion.helpers.code(pick)

        if (!lotto.length) {
          result += "Nobody has won the lotto this time! Check back next time!"
          return result
        }

        // EZ way to only get uniques in an array by using Set
        const winners = [...new Set(lotto.map( n => n.userID ))]
        const winnerStr = winners.map(bastion.helpers.toMention).join(", ")
        result += "Our winners: \n👏 "+winnerStr

        const split = Math.floor(pool / winners.length)
        result += `\nEach winner gets ${split} royroybucks`

        for (var i = 0; i < winners.length; i++) {
          const user = await rrb.findOne({ userID: winners[i] })
          user.bucks += split
          await rrb.update({ userID: user.userID }, user)
        }

        // Remove all lotto entries
        await q.remove({})

        return result
      }
    }

  ]
}