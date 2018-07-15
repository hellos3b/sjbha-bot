import mongoose from 'mongoose';

const swirlSchema = mongoose.Schema({
    message: String,
    timestamp: { 
        type : Date, 
        default: Date.now 
    }
});


export default mongoose.model('tldr', swirlSchema);