import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    id: String,
    date: String, 
    info: String, 
    userID: String, 
    username: String,
    sourceChannelID: String,  
    info_id: String,
    rsvp_id: String,
    reactions: {
        yes: Array,
        maybe: Array
    }
});


export default mongoose.model('MeetupArchive', Schema);