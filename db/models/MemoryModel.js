import mongoose from 'mongoose';

const memorySchema = mongoose.Schema({
    title: String,
    readableID: String,
    timestamp: { 
        type : Date, 
        default: Date.now 
    },
    tldrs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tldr' }]
});


export default mongoose.model('memory', memorySchema);