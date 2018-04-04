import mongoose from 'mongoose';

const swirlSchema = mongoose.Schema({
    userId: String,
    user: String,
    message: String
}, { collection: 'swirlCount' });


export default mongoose.model('SwirlCount', swirlSchema);