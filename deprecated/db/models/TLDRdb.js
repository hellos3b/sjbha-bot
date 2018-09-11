import TLDRModel from "./TLDRModel"
import logger from 'winston'

export default {

    getRecent() {
        return new Promise((resolve, reject) => {
            TLDRModel.find()
                .sort({'timestamp': -1})
                .limit(10)
                .exec( (err, models) => {
                    resolve(models);
                });
        });
    },

    getAll() {
        return new Promise((resolve, reject) => {
            TLDRModel.find()
                .sort({'timestamp': -1})
                .exec( (err, models) => {
                    resolve(models);
                });
        })
    },

    saveTLDR(json) {
        return new Promise((resolve, reject) => {
            TLDRModel.create(json, function(err, doc){
                if (err) {
                    logger.error(err);
                    reject(err);
                } else {
                    logger.info(`Saved TLDR model`);
                    resolve();
                }
            });
        })
    }

}