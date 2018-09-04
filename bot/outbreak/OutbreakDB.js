import OutbreakSchema from "./OutbreakSchema"
import logger from 'winston'
import Outbreak from "./Outbreak";

export default {

    // findUserByName(name) {
    //     logger.debug("Finding player with user with name: "+name);
    //     return new Promise( (resolve, reject) => {
    //         TeamSchema.findOne({ user: name })
    //             .exec( (err, player) => {
    //                 if (err) {
    //                     logger.error(err);
    //                     reject(err);   
    //                 }
    //                 logger.debug("player",player);
    //                 if (!player) {
    //                     resolve(null);
    //                 } else {
    //                     resolve(player);
    //                 }
    //             });
    //     });
    // },

    findUser(userID) {
        logger.debug("Finding infection with user with ID: "+userID);
        return new Promise( (resolve, reject) => {
            OutbreakSchema.findOne({ userID: userID })
                .exec( (err, player) => {
                    if (err) {
                        logger.error(err);
                        reject(err);   
                    }

                    if (!player) {
                        resolve(null);
                    } else {
                        resolve(player);
                    }
                });
        });
    },

    getAll() {
        return new Promise((resolve, reject) => {
            OutbreakSchema.find()
                .exec( (err, result) => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    } 
                    resolve( result );
                });
        });
    },

    saveUser(json) {
        return new Promise((resolve, reject) => {
            OutbreakSchema.findOne({ userID: json.userID }, (err, doc) => {
                let user = (doc) ? doc.set(json) : new OutbreakSchema(json);
            
                user.save((saveErr, savedStat) => {
                    if (saveErr) throw saveErr;
                    console.log("saved infected user", savedStat);
                    resolve();
                });
            });
        })
    }

}