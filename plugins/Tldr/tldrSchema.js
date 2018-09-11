import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    message: String,
    from: String,
    timestamp: { 
        type : Date, 
        default: Date.now 
    }
})

export default mongoose.model('tldr', Schema)