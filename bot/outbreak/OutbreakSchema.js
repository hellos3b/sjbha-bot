import mongoose from 'mongoose';

const outbreakSchema = mongoose.Schema({
    user: String, // infected user
    userID: String, // infected userID
    infectedBy: String, // infected by user
    infectedByID: String, // infected by user ID
    infection: String, // "infected", "vaccine"
    timestamp: {
        type: Date,
        default: new Date()
    }
});

export default mongoose.model('Outbreak', outbreakSchema);