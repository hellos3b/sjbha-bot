import mongoose from 'mongoose';

const statsModel = mongoose.Schema({
    count: String,
    timestamp: Date
});


export default mongoose.model('stats', statsModel);