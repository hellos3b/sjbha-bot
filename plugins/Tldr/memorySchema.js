import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    tldrs: [{type: mongoose.Schema.Types.ObjectId, ref: 'tldr'}],
    title: String,
    readableID: String,
    timestamp: { 
        type : Date, 
        default: Date.now 
    }
})

export default mongoose.model('memories', Schema)