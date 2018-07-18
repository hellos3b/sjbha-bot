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
    }
});

export default mongoose.model('stravaID', stravaSchema);