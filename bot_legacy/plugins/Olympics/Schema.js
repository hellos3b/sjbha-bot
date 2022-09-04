import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    name: String,
    players: String,
    primary: String,
    secondary: String,
    flag: Number
});

export default mongoose.model('Olympics', Schema);