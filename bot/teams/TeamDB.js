import TeamSchema from "./TeamSchema"
import logger from 'winston'

export default {

    findUser(userID) {
        logger.debug("Finding player with user with ID: "+userID);
        return new Promise( (resolve, reject) => {
            TeamSchema.findOne({ userID: userID })
                .exec( (err, player) => {
                    if (err) {
                        logger.error(err);
                        reject(err);   
                    }
                    logger.debug("player",player);
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
            TeamSchema.find()
                .exec( (err, players) => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    } 
                    resolve( players );
                });
        });
    },

    saveUser(json) {
        return new Promise((resolve, reject) => {
            TeamSchema.findOne({ userID: json.userID }, (err, doc) => {
                let user = (doc) ? doc.set(json) : new TeamSchema(json);
            
                user.save((saveErr, savedStat) => {
                    if (saveErr) throw saveErr;
                    console.log("saved team user", savedStat);
                    resolve();
                });
            });
        })
    }

}