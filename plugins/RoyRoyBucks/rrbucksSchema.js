import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    user: String,
    userID: String,
    bucks: Number
})

export default mongoose.model('rrbucks', Schema)