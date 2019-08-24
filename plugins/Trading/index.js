/**
 *  Let people subscribe/unsubscribe from taggable roles
 *
 */

import deepmerge from "deepmerge";
import moment from "moment";
import "./HoldingsSchema";
import Axios from 'axios'
import Table from 'ascii-table'

const baseConfig = {};

const getPrice = (ticker) => {
  return Axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${process.env.ALPHA_VANTAGE_KEY}`)
}

const getBatchPrices = (tickers) => {
  return Axios.get(`https://www.alphavantage.co/query?function=BATCH_STOCK_QUOTES&symbols=${tickers.join(",")}&apikey=${process.env.ALPHA_VANTAGE_KEY}`)
}


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

export default function(bastion, opt = {}) {
  const config = deepmerge(baseConfig, opt);

  const q = new bastion.Queries("holdings")
  const rrb = new bastion.Queries("rrbucks");

  return [

    {
      command: `portfolio`,

      restrict: ['363123179696422916'],
      restrictMessage: `RRB Trading is only for <#363123179696422916>`, 

      resolve: async function(context, message) {
        let holdings = await q.find({ userID: context.userID, sold: false })

        if (!holdings.length) return `You're not invested in anything! Use \`!buy\` to get started`

        let currentPrices;
        
        try {
          currentPrices = await getBatchPrices(holdings.map(n => n.ticker));
        } catch (e) {
          return 'Something went wrong trying to get the current stock prices'
        }

        if (currentPrices.data['Note']) {
          return `<:bankbot:613855784996044826> We are being rate limited by the API, try again later (5/min, 500/day)`
        }

        // Get current prices
        const quotes = currentPrices.data['Stock Quotes']
          .reduce( (l, c) => {
              const symbol =  c['1. symbol']
              const price = c['2. price']
              return Object.assign({}, l, {
                [symbol.toLowerCase()]: parseInt(price)
              })
            }, {})

        // Attach current price to holdings
        holdings = holdings.map( h => {
          return Object.assign({}, {
            ticker: h.ticker,
            buyPrice: h.buyPrice,
            amt: h.amt
          },  {
            currentPrice: quotes[h.ticker.toLowerCase()]
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

        const percent = getPercentage(portfolio.original, portfolio.current)
        const diff = getDiff(portfolio.original, portfolio.current)

        msg = `Value [${portfolio.original} ► ${portfolio.current}] G/L [${diff} ${percent}]\n\n`

        const table = new Table()
        table.setHeading('smbl', 'qty', 'price', 'today', 'value', 'g/l', '%')
        for (var i = 0; i < holdings.length; i++) {
          const h = holdings[i]

          const value = h.amt * h.currentPrice
          const original = h.amt * h.buyPrice
          const hDiff = getDiff(original, value)
          const hPercent = getPercentage(original, value)

          table.addRow(
            h.ticker.toUpperCase(),
            h.amt,
            h.buyPrice,
            h.currentPrice,
            value,
            hDiff,
            hPercent
          )
        }

        return bastion.helpers.code(msg + table.toString(), "ini")
      }
    },

    {
      command: `sell`,

      restrict: ['363123179696422916'],
      restrictMessage: `RRB Trading is only for <#363123179696422916>`, 

      resolve: async function(context, message) {
        const holdings = await q.find({userID: context.userID, sold: false})

        if (!holdings.length) {
          return `<:bankbot:613855784996044826> You're not invested in anything`
        }

        const holdings_list = holdings.map( (e, i) => `${i}: ${e.amt} ${e.ticker.toUpperCase()}`).join("\n")

        const index = await bastion.Ask(`Which stock do you want to sell?\n${bastion.helpers.code(holdings_list)}`, context)    

        const seller = holdings[index]
        if (!seller) return `'${index}' is not a valid option; Please pick an option from 0-${holdings.length}`

        let response;
        try {
          response = await getPrice(seller.ticker)
        } catch (e) {
          return 'Something went wrong trying to get the current stock prices'
        }

        if (response.data['Note']) {
          return `<:bankbot:613855784996044826> We are being rate limited by the API, try again later (5/min, 500/day)`
        }

        const quote = response.data['Global Quote']
        const stockPrice = parseInt(quote['05. price'])
        const sellPrice = seller.amt * stockPrice

        const confirm = await bastion.Ask(`Sell ${seller.amt} **${seller.ticker.toUpperCase()}** for **${sellPrice}** royroybucks? (y/n)\n<:bankbot:613855784996044826> *+${FEE}rrb Transaction Fee*`, context)   

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
        const [amtInput, ticker] = message.split(" ")

        if (!amtInput) {
          return `Command is: \`!buy {amount} {symbol}\``
        }

        const amt = parseInt(amtInput)

        if (!Number.isInteger(amt)) return `'${amt}' is not a valid amount`

        let response;
        try {
          response = await getPrice(ticker)
        } catch (e) {
          return 'Something went wrong trying to get the current stock prices'
        }

        if (response.data['Note']) {
          return `<:bankbot:613855784996044826> We are being rate limited by the API, try again later (5/min, 500/day)`
        }

        const err = response.data['Error Message']
        if (err) {
          return `Can't find stock **${ticker}**`
        }

        const quote = response.data['Global Quote']
        const stockPrice = parseInt(quote['05. price'])

        if (stockPrice < 10) {
          return `<:bankbot:613855784996044826> Sorry, that stock is not on the RRB market (only stocks $10 or more can be traded)`
        }

        const user = await rrb.findOne({ userID: context.userID })

        if (!user) return `You need royroybucks. Use \`!royroybucks\` to initialize your bank`

        const price = (amt * stockPrice)

        if (user.bucks < (price + FEE)) return `You don't have enough royroybucks to execute the trade (Cost: ${price} Bucks: ${user.bucks})`

        // let user = await q.findOne({ userID: context.userID });

        const confirm = await bastion.Ask(
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
