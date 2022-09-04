import logger from 'winston'
import SeasonsModel from './SeasonsModel'

export default {

    saveSeason(json) {
        return new Promise((resolve, reject) => {
            console.log('save season', json);
            SeasonsModel.create(json, function(err, doc){
                if (err) {
                    logger.error(err);
                    reject(err);
                } else {
                    logger.info(`Saved Season`);
                    resolve();
                }
            });
        });
    },

    getSeasons() {
        console.log('get seasons', SeasonsModel);
        return new Promise((resolve, reject) => {
            SeasonsModel.find()
                .exec( (err, seasons) => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    } 
                    resolve( seasons );
                });
        });
    }

}