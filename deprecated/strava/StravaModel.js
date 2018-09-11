import mongoose from 'mongoose';

const stravaSchema = mongoose.Schema({
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
    }
});

export default mongoose.model('stravaID', stravaSchema);