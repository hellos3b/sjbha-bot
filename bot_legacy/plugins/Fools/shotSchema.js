import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    shots:[{
        user: String,
        team: String,
        userID: String
    }],
    channelID: String,
    timestamp: Date
});

export default mongoose.model('FoolsShot', Schema);