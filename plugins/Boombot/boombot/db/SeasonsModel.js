import mongoose from 'mongoose';

const seasonSchema = mongoose.Schema({
    name: String,
    timestamp: { type: Date, default: Date.now },
    leaderboard: [{
        user: String,
        userID: String,
        bank: Number,
        debt: Number,
        games: Number,
        survives: Number
    }]
});

export default mongoose.model('BoomSeason', seasonSchema);