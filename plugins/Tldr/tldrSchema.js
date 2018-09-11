import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    message: String,
    from: String,
    channelID: String,
    channel: String,
    timestamp: { 
        type : Date, 
        default: Date.now 
    }
})

export default mongoose.model('tldr', Schema)