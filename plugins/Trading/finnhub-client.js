// https://finnhub.io/docs/api#introduction

import Axios from 'axios'

class Stock {
  constructor(symbol, data) {
    this.symbol = symbol
    this.current = data.c
  }
}

/**
 * 
 * @param {string} symbol 
 */
export const getQuote = (symbol) => {
  return Axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${process.env.FINNHUB_TOKEN}`)
    .then(r => new Stock(symbol, r.data))
}

/**
 * 
 * @param {string[]} symbols 
 */
export const getQuotes = (symbols) => {
  return Promise
    .all(symbols.map(getQuote))
    .then( s => s.reduce( (result, stock) => 
      Object.assign(
        result, 
        { [stock.symbol.toUpperCase()]: stock.current }
      ),
      {}
    ))
}