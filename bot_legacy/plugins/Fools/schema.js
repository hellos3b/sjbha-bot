import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    user: String,
    userID: String,
    count: Number,
    misses: {
        type: Number,
        default: 0
    }
});

export default mongoose.model('Fools', Schema);