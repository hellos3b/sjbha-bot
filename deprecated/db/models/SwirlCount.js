import mongoose from 'mongoose';

const swirlSchema = mongoose.Schema({
    userID: String,
    user: String,
    message: String,
    timestamp: { 
        type : Date, 
        default: Date.now 
    }
}, { collection: 'swirlCount' });


export default mongoose.model('SwirlCount', swirlSchema);