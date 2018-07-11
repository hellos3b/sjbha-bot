import mongoose from 'mongoose';

import TeamTest from '../bot/teams/Points'

let db;

export default {
    connect() {
        mongoose.connect(`mongodb://${process.env.MLAB_USERNAME}:${process.env.MLAB_PASSWORD}@ds149059.mlab.com:49059/bored-humans`)
        db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function() {
            console.log("Connected to MongoDB");

            TeamTest.getPoints();
        });
    },

    getDB() {
        return db;
    }
}