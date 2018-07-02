import mongoose from 'mongoose';

const trophySchema = mongoose.Schema({
    name: String,
    type: String
});

const historySchema = mongoose.Schema({
    season: String, // Season 0
    bank: Number,
    games: Number,
    survives: Number,
    rank: Number, // leaderboard place
    playerCount: Number,
    timestamp: { type: Date, default: Date.now() }    
})

const playerSchema = mongoose.Schema({
    user: String,
    userID: String,
    bank: Number,
    debt: Number,
    games: Number,
    survives: Number,
    season_games: Number,
    season_survives: Number,
    active: Boolean,
    trophies: [trophySchema],
    history: [historySchema]
});

export default mongoose.model('BoomPlayer', playerSchema);