import MarkovModel from "./MarkovModel"
import logger from 'winston'

export default {

    // getRecent() {
    //     return new Promise((resolve, reject) => {
    //         TLDRModel.find()
    //             .sort({'timestamp': -1})
    //             .limit(10)
    //             .exec( (err, models) => {
    //                 resolve(models);
    //             });
    //     });
    // },

    // getAll() {
    //     return new Promise((resolve, reject) => {
    //         TLDRModel.find()
    //             .sort({'timestamp': -1})
    //             .exec( (err, models) => {
    //                 resolve(models);
    //             });
    //     })
    // },

    getFromUser(userID) {
        return new Promise((resolve, reject) => {
            MarkovModel.find({ userID })
                .exec( (err, models) => {
                    if (!models.length) {
                        resolve(null)
                    } else {
                        resolve(models)
                    }
                });
        });
    },

    save(json) {
        return new Promise((resolve, reject) => {
            MarkovModel.create(json, function(err, doc){
                if (err) {
                    logger.error(err);
                    reject(err);
                } else {
                    logger.info(`Saved markov model`);
                    resolve();
                }
            });
        })
    }

}