import db from 'diskdb'
import logger from 'winston'

db.connect(__dirname + "/../db", ['meetups', 'archive']);

let meetup_db = [];

export default {

    save(meetup) {
        let result = db.meetups.update({
                id: meetup.id()
            }, 
            meetup.toJSON(), 
            {
                upsert: true
            });
        logger.info(`Saved meetup - '${meetup.info()}'`);
        logger.debug(result);
    },

    remove(meetup) {
        let id = (typeof meetup.id === 'string') ? meetup.id : meetup.id();
        let result = db.meetups.remove({ id: id });
    },

    getLatest() {
        return db.meetups.find()[0];
    },

    findByUserID(userID) {
        let result = db.meetups.find({userID: userID});
        return result;
    },

    findMeetup(id) {
        let result = db.meetups.findOne({id: id});
        return result;
    },

    archive: function(meetup) {
        this.remove(meetup);
        db.archive.save(meetup);
    },

    getMeetups() {
        return db.meetups.find();
    },

    getArchive() {
        return db.archive.find();
    }
}