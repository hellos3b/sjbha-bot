import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    userID: String,
    amt: Number,
    ticker: String,
    buyPrice: Number,
    timestamp: {
      default: Date.now,
      type: Date
    }
})

export default mongoose.model('holdings', Schema)