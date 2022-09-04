import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    user: String,
    userID: String,
    bucks: Number,
    reserve: {
        type: Number,
        default: 0
    }
})

export default mongoose.model('rrbucks', Schema)