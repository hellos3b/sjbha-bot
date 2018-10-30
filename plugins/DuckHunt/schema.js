import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    user: String,
    userID: String,
    count: Number
});

export default mongoose.model('Duckhunt', Schema);