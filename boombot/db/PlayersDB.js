import Player from "../game/Player"
import PlayerModel from "./PlayerModel"
import logger from 'winston'

export default {

    findOrCreate: async function(user, userID) {
        let player = await this.findPlayer(userID);
        if (player) {
            return player;
        }

        player = new Player({ user, userID });
        await this.save(player);
        
        return player;
    },

    findPlayer(userID) {
        logger.debug("Finding player with user with ID: "+userID);
        return new Promise( (resolve, reject) => {
            PlayerModel.findOne({ userID: userID })
                .exec( (err, player) => {
                    if (err) {
                        logger.error(err);
                        reject(err);   
                    }
                    logger.debug("player",player);
                    if (!player) {
                        resolve(null);
                    } else {
                        resolve(new Player(player));
                    }
                });
        });
    },

    getAll() {
        return new Promise((resolve, reject) => {
            PlayerModel.find()
                .exec( (err, players) => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    } 
                    resolve( players.map( p => new Player(p) ) );
                });
        });
    },

    fetchLeaderboard: async function() {
        let players = await this.getAll();
        let leaderboard = players.slice()
            .sort( (a, b) => b.netWorth() - a.netWorth() );
        return leaderboard;
    },

    save(player) {
        if (typeof player === 'array') {
            return this.savePlayers(player);
        } else {
            return this.savePlayers([player]);
        }
    },

    savePlayers(playerList) {
        return Promise.all(
            playerList.map( p => this.savePlayer(p))
        );
    },

    savePlayer(player) {
        let json = player.toJSON();
        return new Promise((resolve, reject) => {
            PlayerModel.findOneAndUpdate({
                userID: json.userID
            }, json, {upsert:true}, function(err, doc){
                if (err) logger.error(err);
                else logger.info(`Saved Player - '${json.user}'`);
            });
        })
    }

}