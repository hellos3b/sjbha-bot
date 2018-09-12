import mongoose from 'mongoose';

const ChallengeSchema = mongoose.Schema({
    challenge: {
        type: { type: String },
        multi: Number,
        distanceMulti: Number,
        name: String
    },
    targets: {
        time: Number,
        distance: Number,
        pace_seconds: Number
    },
    finished: {
        type: Boolean,
        default: false
    }
})

const Schema = mongoose.Schema({
    user: String,
    userID: String,
    stravaID: {
        type: String,
        default: ""
    },
    accessToken: {
        type: String,
        default: ""
    },
    level: {
        type: Number,
        default: 1
    },
    EXP: {
        type: Number,
        default: 0
    },
    challenge: ChallengeSchema
});

export default mongoose.model('stravaID', Schema);