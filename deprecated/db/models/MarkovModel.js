import mongoose from 'mongoose';

const markovSchema = mongoose.Schema({
    userID: String,
    message: String
});

export default mongoose.model('markov', markovSchema);