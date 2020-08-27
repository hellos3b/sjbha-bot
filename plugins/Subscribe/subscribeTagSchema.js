import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    name: String,
    id: String,
})

export default mongoose.model('subscribeTag', Schema)