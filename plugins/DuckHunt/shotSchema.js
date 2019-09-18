import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    shotBy: {
        user: String,
        userID: String
    },
    misses: [{
        user: String,
        userID: String
    }],
    channelID: String,
    timestamp: Date
});

export default mongoose.model('DuckhuntShot-s3', Schema);