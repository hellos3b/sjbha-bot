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
  cost: 5
}

const delay = ms => 
  new Promise( (resolve, reject) => {
    setTimeout(resolve, ms)
  })

export default function (bastion, opt = {}) {
  const config = deepmerge(baseConfig, opt)

  const q = new bastion.Queries('lotto')
  const rrb = new bastion.Queries('rrbucks')

  const markStale = async () => {
    return q.Schema.update({}, { $set: { stale: true }}, { multi: true })
  }

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
        if (cmd === 'coverage') return this.route("coverage")

        let guessList = await q.find({userID: context.userID})
        const prevGuesses = new Set(guessList.map(n => n.guess))

        const guesses = [...new Set(
          message.split(" ")
            .map( n => parseInt(n))
            .filter( n => !isNaN(n))
            .filter( n => n)
            .filter( n => n >= 1 && n <= 100)
            .filter( n => !prevGuesses.has(n))
        )]

        if (user.bucks < guesses.length*config.cost) return `You don't have enough royroybucks to buy ${guesses.length} tickets`
        if (!guesses.length) return `None of those ticket numbers are valid (You may already have picked them)`

        let count = guessList.filter(n => !n.stale).length

        if (count >= 10) return 'You already have the max number of tickets (10)'
        
        let successes = []
        for (var i = 0; i < guesses.length; i++) {
          if (count >= 10) break;
          user.bucks -= config.cost
        
          const entry = {
            user: user.user,
            userID: user.userID,
            guess: guesses[i]
          }
          q.create(entry)
          successes.push(guesses[i])

          count++
        }

        rrb.update({userID: user.userID}, user)

        const res = guesses.map(n => `#${n}`).join(" ")
        return `Bought ticket(s) for ${res}.\nroyroybucks: ${user.bucks}`
      }
    },

    {
      action: `${config.command}:info`,

      resolve: async function (context, message) {
        const lotto = await q.find()
        const amt = lotto.length * config.cost

        const picks = lotto.filter( n => n.userID === context.userID )
        const stalePicks = picks.filter( n => n.stale )
        const currentPicks = picks.filter( n => !n.stale )
        const currentMsg = currentPicks.length ? currentPicks.map(n => n.guess).join(", ") : "None"
        const staleMsg = stalePicks.length ? stalePicks.map(n => n.guess).join(", ") : ""

        let msg = `Pool: ${amt}rrb\nPicks (${currentPicks.length}/10): ${currentMsg}`

        if (stalePicks.length) {
          msg += `\nCarried picks: ${staleMsg}`
        }

        let custom = bastion.helpers.code(msg, 'js')

        custom += "*Lotto is drawn on Wednesday nights*"

        return custom
      }
    },

    {
      action: `${config.command}:coverage`,

      resolve: async function (context, message) {
        if (context.userID !== '125829654421438464') return;

        const lotto = await q.find()
        const unique = new Set(lotto.map(n => n.guess))
        const uniqueUsers = new Set(lotto.map(n => n.userID))

        let picks = {}
        for (var i = 0; i < lotto.length; i++) {
          const guess = lotto[i].guess
          if (!picks[guess]) {
            picks[guess] = 1
          } else {
            picks[guess] ++
          }
        }

        let counts = {}
        for (var k in picks) {
          if (!counts[picks[k]]) {
            counts[picks[k]] = 1
          } else {
            counts[picks[k]]++
          }
        }

        return `total: ${lotto.length}, unique: ${unique.size}, users: ${uniqueUsers.size}\n${JSON.stringify(counts)}`
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

        bastion.send(context.channelID, "Today's lotto pick is....")
        await delay(3000)
        bastion.send(context.channelID, "*drum roll*")
        await delay(3000)

        let winningNumber = bastion.helpers.code(pick)

        bastion.send(context.channelID, winningNumber)
        await delay(3000)

        if (!lotto.length) {
          await markStale()
          return "Nobody has won the lotto this time! Check back next time!"
        }

        let result = ""
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