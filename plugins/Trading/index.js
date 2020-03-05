/**
 *  Let people subscribe/unsubscribe from taggable roles
 *
 */

import deepmerge from "deepmerge";
import moment from "moment";
import "./HoldingsSchema";
import Axios from 'axios'
import Table from 'ascii-table'
import * as finnhub from './finnhub-client'

const baseConfig = {};


const getPercentage = (original, current) => {
  if (original < current) {
    const diff = current - original
    const p = ((diff / original)*100).toFixed(1)
    return `${p}%`
  } else if (original > current) {
    const diff = original - current
    const p = ((diff / original)*100).toFixed(1)
    return `-${p}%`
  }

  return "0%"
}

const getDiff = (original, current) => {
  const val = current - original
  return val > 0 ? `+${val}` : `${val}`
}

const FEE = 3

const getTime = () => {
  return moment(Date.now()).tz("America/Los_Angeles")
}

const marketIsOpen = () => {
  const time = getTime()
  const hours = time.hours()
  const day = time.day()

  // If weekend, its closed
  if (day === 0 || day === 6) return false;

  // 6am - 1pm
  return (hours >= 6 && hours < 13) 
}

const toFixed = (val) => Math.floor(parseFloat(val) * 100) / 100

export default function(bastion, opt = {}) {
  const config = deepmerge(baseConfig, opt);

  const q = new bastion.Queries("holdings")
  const rrb = new bastion.Queries("rrbucks");

  return [

    {
      command: `portfolio`,

      // restrict: ['363123179696422916'],
      restrictMessage: `RRB Trading is only for <#363123179696422916>`, 

      resolve: async function(context, message) {
        const [arg] = message.split(" ")

        let holdings = await q.find({ userID: context.userID, sold: false })

        if (!holdings.length) return `You're not invested in anything! Use \`!buy\` to get started`

        let quotes;
        
        try {
          quotes = await finnhub.getQuotes(holdings.map(n => n.ticker));
        } catch (e) {
          return e.response ? `🚫 Error: \`${e.response.data}\`` : '🚫 Something went wrong trying to get the current stock prices'
        }

        console.log("quotess", quotes)

        // Attach current price to holdings
        holdings = holdings.map( h => {
          const currentPrice = quotes[h.ticker.toUpperCase()]
          const original = Math.floor(h.amt * toFixed(h.buyPrice))
          const value =  Math.floor(h.amt * toFixed(currentPrice))

          return Object.assign({}, {
            ticker: h.ticker,
            buyPrice: h.buyPrice,
            amt: h.amt,
            value: value,
            original: original,
            hDiff: getDiff(original, value),
            hPercent: getPercentage(original, value)
          },  {
            currentPrice: currentPrice
          })
        })

        // Calculate overall royroybucks (previous, current)
        const portfolio = holdings.reduce( (res, h) => {
          res.original += h.amt * h.buyPrice
          res.current += h.amt * h.currentPrice
          return res
        }, { current: 0, original: 0})

        let msg = ``

        // Calculate percentage gain on portfolio

        portfolio.original = Math.floor(portfolio.original)
        portfolio.current = Math.floor(portfolio.current)
        const percent = getPercentage(portfolio.original, portfolio.current)
        const diff = getDiff(portfolio.original, portfolio.current)

        msg = `Value [${portfolio.original} ► ${portfolio.current}] G/L [${diff} ${percent}]\n`

        const table = new Table()
        table.setHeading('smbl', 'qty', 'price', 'today', 'value', 'g/l', '%')
        for (var i = 0; i < holdings.length; i++) {
          const h = holdings[i]
          
          table.addRow(
            h.ticker.toUpperCase(),
            h.amt,
            h.buyPrice,
            h.currentPrice,
            h.value,
            h.hDiff,
            h.hPercent
          )
        }

        if (arg === "full") {
          return bastion.helpers.code(msg + '\n' + table.toString(), "ini")
        }

        msg = msg = `${portfolio.original} ► **${portfolio.current}** ${diff} (${percent})\n`
        const minView = holdings.map( h => `**${h.amt} ${h.ticker.toUpperCase()}** ${h.hDiff} (${h.hPercent})`).join(' ')
        return msg + minView
      }
    },

    {
      command: `sell`,

      restrict: ['363123179696422916'],
      restrictMessage: `RRB Trading is only for <#363123179696422916>`, 

      resolve: async function(context, message) {
        if (!marketIsOpen()) return `<:bankbot:613855784996044826> Market is closed! Come back next trading day`

        const holdings = await q.find({userID: context.userID, sold: false})

        if (!holdings.length) {
          return `<:bankbot:613855784996044826> You're not invested in anything`
        }

        const holdings_list = holdings.map( (e, i) => `${i}: ${e.amt} ${e.ticker.toUpperCase()}`).join("\n")

        const ctx = await bastion.Ask(`Which stock do you want to sell?\n${bastion.helpers.code(holdings_list)}`, context)    
        const index = ctx.message

        const seller = holdings[index]
        if (!seller) return `'${index}' is not a valid option; Please pick an option from 0-${holdings.length}`

        let quote;
        try {
          quote = await finnhub.getQuote(seller.ticker)
        } catch (e) {
          return e.response ? `🚫 Error: \`${e.response.data}\`` : '🚫 Something went wrong trying to get the current stock prices'
        }

        const stockPrice = parseFloat(quote.current)
        const sellPrice = Math.floor(seller.amt * stockPrice)

        const {message: confirm} = await bastion.Ask(`Sell ${seller.amt} **${seller.ticker.toUpperCase()}** for **${sellPrice - FEE}** royroybucks? (y/n)\n<:bankbot:613855784996044826> *+${FEE}rrb Transaction Fee*`, context)   

        if (confirm.toLowerCase() !== 'y') {
          return `Okay, cancelling transaction`
        }

        const award = sellPrice - FEE

        seller.sold = true
        seller.soldTimestamp = Date.now()
        seller.soldPrice = stockPrice
        await q.update({ _id: seller._id }, seller)

        const bank = await rrb.findOne({ userID: "FED-RESERVE"})
        bank.bucks += FEE
        await rrb.update({ userID: "FED-RESERVE"}, bank)
        
        const user = await rrb.findOne({ userID: context.userID})
        user.bucks += award
        await rrb.update({ userID: context.userID}, user)


        return "<:bankbot:613855784996044826> Sold!"
      }
    },

    {
      command: `buy`,

      restrict: ['363123179696422916'],
      restrictMessage: `RRB Trading is only for <#363123179696422916>`, 

      resolve: async function(context, message) {
        if (!marketIsOpen()) return `<:bankbot:613855784996044826> Market is closed! Come back next trading day`

        const [amtInput, ticker] = message.split(" ")

        if (!amtInput || !ticker) {
          return `Command is: \`!buy {amount} {symbol}\``
        }

        const amt = parseInt(amtInput)

        if (!Number.isInteger(amt)) return `'${amtInput}' is not a valid amount`

        let quote;
        try {
          quote = await finnhub.getQuote(ticker)
        } catch (e) {
          return e.response ? `🚫 Error: \`${e.response.data}\`` : '🚫 Something went wrong trying to get the current stock prices'
        }

        let stockPrice = toFixed(quote.current)

        if (stockPrice < 1) {
          return `<:bankbot:613855784996044826> Sorry, that stock is not on the RRB market (only stocks $1 or more can be traded)`
        }

        const user = await rrb.findOne({ userID: context.userID })

        if (!user) return `You need royroybucks. Use \`!royroybucks\` to initialize your bank`

        const price = Math.floor((amt * stockPrice))

        if (user.bucks < (price + FEE)) return `You don't have enough royroybucks to execute the trade (Cost: ${price + FEE} Bucks: ${user.bucks})`


        const {message: confirm} = await bastion.Ask(
          `<@${context.userID}> Buy ${amt} shares of ${ticker} for ${price}rrb? (y/n)\n<:bankbot:613855784996044826> *+${FEE}rrb Transaction Fee*`, 
          context, 
          (val) => {}, 2)

        if (confirm.toLowerCase() !== 'y') return `Okay, cancelling`

        const bank = await rrb.findOne({ userID: "FED-RESERVE"})
        bank.bucks += FEE
        await rrb.update({ userID: "FED-RESERVE"}, bank)

        user.bucks -= price
        user.bucks -= FEE
        await rrb.update({ userID: user.userID }, user)

        const holding = {
          userID: user.userID,
          amt: amt,
          ticker: ticker,
          buyPrice: stockPrice
        }

        await q.create(holding)

        return "<:bankbot:613855784996044826> You got it"
      }
    }
  ];
}
