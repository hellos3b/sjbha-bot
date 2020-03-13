import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    user: String, // infected user
    userID: String, // infected userID
    infectedBy: String, // infected by user
    infectedByID: String, // infected by user ID
    message: String, // The message that got u
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('ModeloVirus', Schema);