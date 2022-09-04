import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    shotBy: {
        user: String,
        userID: String,
        shotTimestamp: Date
    },
    misses: [{
        user: String,
        userID: String,
        shotTimestamp: Date
    }],
    channelID: String,
    timestamp: Date,
    spawnTimestamp: Date
});

export default mongoose.model('DuckhuntShot-s3', Schema);