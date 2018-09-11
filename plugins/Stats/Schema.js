import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    count: Number,
    timestamp: Date
})

export default mongoose.model('stats', Schema)