import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    userID: String,
    amt: Number,
    ticker: String,
    buyPrice: Number,
    timestamp: {
      default: Date.now,
      type: Date
    },
    sold: {
      type: Boolean,
      default: false
    },
    soldTimestamp: Date,
    soldPrice: Number
})

export default mongoose.model('holdings', Schema)