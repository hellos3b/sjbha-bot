import TeamSchema from "./TeamSchema"
import logger from 'winston'

export default {

    findUserByName(name) {
        logger.debug("Finding player with user with name: "+name);
        return new Promise( (resolve, reject) => {
            TeamSchema.findOne({ user: name })
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
                    let result = players.sort( (a, b) => {
                        if (a.user > b.user) { 
                            return 1; 
                        } else if (a.user < b.user) { 
                            return -1; 
                        } else { 
                            return 0; 
                        }
                    })
                    resolve( result );
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