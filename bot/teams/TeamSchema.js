import mongoose from 'mongoose';

const teamSchema = mongoose.Schema({
    user: String,
    userID: String,
    team: String
});

export default mongoose.model('TeamSchema', teamSchema);