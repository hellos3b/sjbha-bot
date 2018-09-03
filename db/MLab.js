import mongoose from 'mongoose';

import TeamTest from '../bot/teams/Points'
import TeamDB from '../bot/teams/TeamDB'

let db;

export default {
    connect() {
        console.log("Connect", process.env.MLAB_USERNAME);
        mongoose.connect(`mongodb://${process.env.MLAB_USERNAME}:${process.env.MLAB_PASSWORD}@ds149059.mlab.com:49059/bored-humans`)
        db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', async function() {
            console.log("Connected to MongoDB");
        });
    },

    getDB() {
        return db;
    }
}