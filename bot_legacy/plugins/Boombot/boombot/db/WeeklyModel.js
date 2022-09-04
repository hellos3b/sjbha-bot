import mongoose from 'mongoose';

const weeklySchema = mongoose.Schema({
    user: String,
    userID: String,
    profit: {
        type: Number,
        default: 0
    },
    lottery: {
        type: Number,
        default: 0
    }
});

export default mongoose.model('BoomPlayerWeekly', weeklySchema);