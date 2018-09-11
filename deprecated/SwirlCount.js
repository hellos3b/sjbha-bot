/**
 *  List of commands for the bot to listen to
 * 
 */

import logger from 'winston'
import SwirlCountModel from '../db/models/SwirlCount';

import Mongoose from 'mongoose'

export default {

    // Start a meetup
    add: function({user, userID, message}) {

        // Ignore if it's this bot
        if (userID === "430522654466768907") {
            return;
        }

        let swirlCount = new SwirlCountModel({
            user,
            userID,
            message
        });

        swirlCount.save(function(err, doc){
            if (err) logger.error(err);
            else logger.info(`Saved swirl count - '${user}'`);
        });
    }

};
