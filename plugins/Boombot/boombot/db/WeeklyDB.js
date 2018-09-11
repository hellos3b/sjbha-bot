import WeeklyModel from "./WeeklyModel"
import logger from 'winston'

export default {

    findOrCreate: async function(user, userID) {
        let player = await this.findPlayer(userID);
        if (player) {
            return player;
        }

        logger.debug("Creating new player "+user);
        player = { user, userID, profit: 0, lottery: 0 };
        await this.save(player);
        
        logger.debug("Player created!");
        return player;
    },

    findPlayer(userID) {
        logger.debug("Finding weekly player with user with ID: "+userID);
        return new Promise( (resolve, reject) => {
            WeeklyModel.findOne({ userID: userID })
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
            WeeklyModel.find()
                .exec( (err, players) => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    } 
                    resolve( players );
                });
        });
    },

    fetchLeaderboard: async function() {
        let players = await this.getAll();
        let leaderboard = players.slice()
            .sort( (a, b) => b.profit - a.profit );
        return leaderboard;
    },

    save(player) {
        if (typeof player === 'array') {
            logger.debug("Saving multiple players");
            return this.savePlayers(player);
        } else {
            logger.debug("Saving one player");
            return this.savePlayers([player]);
        }
    },

    savePlayers(playerList) {
        return Promise.all(
            playerList.map( p => this.savePlayer(p))
        );
    },

    savePlayer(player) {
        let json = player;

        return new Promise((resolve, reject) => {
            WeeklyModel.findOneAndUpdate({
                userID: json.userID
            }, json, {upsert:true}, function(err, doc){
                if (err) {
                    logger.error(err);
                    reject(err);
                } else {
                    logger.info(`Saved Player - '${json.user}'`);
                    resolve();
                }
            });
        })
    },

    clearBoard() {
        console.log("Remove all weekly models");
        WeeklyModel.remove({}, function(err) {
            if (err) {
                console.log(err)
            } else {
                console.log("Supposedly removed all");
            }
        });
    }

}