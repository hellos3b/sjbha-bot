import db from 'diskdb'
import logger from 'winston'

import MeetupModel from '../db/models/MeetupModel';
import ArchiveMeetupModel from '../db/models/ArchiveMeetupModel';

export default {

    save(meetup) {
        logger.debug("mongo.save");
        MeetupModel.findOneAndUpdate({
            id: meetup.id()
        }, meetup.toJSON(), {upsert:true}, function(err, doc){
            if (err) logger.error(err);
            else logger.info(`Saved meetup - '${meetup.info()}'`);
        });
    },

    remove(meetup) {
        logger.debug("mongo.remove");
        let id = (typeof meetup.id === 'string') ? meetup.id : meetup.id();
        MeetupModel.find({ id: id }).remove().exec();
    },

    getLatest() {
        logger.debug("mongo.getLatest");
        return new Promise((resolve, reject) => {
            MeetupModel.find()
                .exec( (err, meetups) => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    } 
                    resolve( meetups[0] );
                });
        });
    },

    findByUserID(userID) {
        logger.debug("mongo.findByUserID");
        return new Promise((resolve, reject) => {
            MeetupModel.find({ userID: userID })
                .exec( (err, meetups) => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    } 
                    resolve( meetups );
                });
        });
    },

    findMeetup(id) {
        logger.debug("mongo.findMeetup");
        return new Promise((resolve, reject) => {
            MeetupModel.findOne({ id: id})
                .exec( (err, meetup) => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    } 
                    resolve( meetup );
                });
        });
    },

    archive(meetup) {
        logger.debug("mongo.archive");
        this.remove(meetup);
        let archive = new ArchiveMeetupModel(meetup);
        archive.save(function(err, doc){
            if (err) logger.error(err);
            else logger.info(`Saved archive - '${meetup.info}'`);
        });
    },

    getMeetups() {
        logger.debug("mongo.getMeetups");
        return new Promise((resolve, reject) => {
            MeetupModel.find()
                .exec( (err, meetups) => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    } 
                    resolve( meetups );
                });
        });
    },

    getArchive() {
        logger.debug("mongo.getMeetups");
        return new Promise((resolve, reject) => {
            ArchiveMeetupModel.find()
                .exec( (err, meetups) => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    } 
                    resolve( meetups );
                });
        });
    }
}