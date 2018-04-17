import mongoose from 'mongoose';

const playerSchema = mongoose.Schema({
    user: String,
    userID: String,
    bank: Number,
    debt: Number,
    games: Number,
    survives: Number
});

export default mongoose.model('BoomPlayer', playerSchema);