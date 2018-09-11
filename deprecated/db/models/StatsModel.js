import mongoose from 'mongoose';

const statsModel = mongoose.Schema({
    count: Number,
    timestamp: Date
});


export default mongoose.model('stats', statsModel);