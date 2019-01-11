import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    user: String,
    userID: String,
    guess: Number,
    stale: {
        type: Boolean,
        default: false
    }
})

export default mongoose.model('lotto', Schema)