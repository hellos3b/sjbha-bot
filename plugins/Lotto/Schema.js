import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    user: String,
    userID: String,
    guess: Number
})

export default mongoose.model('lotto', Schema)