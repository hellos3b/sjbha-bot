import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    user: String,
    userID: String,
    amount: Number,
    statement: String
})

export default mongoose.model('rrbucks-transactions', Schema)