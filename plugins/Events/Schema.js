import mongoose from 'mongoose';

const Schema = mongoose.Schema({
    id: String,
    date: String, 
    timestamp: String,
    info: String, 
    userID: String, 
    options: Object,
    username: String,
    sourceChannelID: String, 
    state: String, 
    info_id: String,
    rsvp_id: String
}, { collection: 'meetups' })

export default mongoose.model('Meetup', Schema)