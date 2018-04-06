import Player from "../game/Player"
import logger from 'winston'

let player_db = [];

export default {

    findOrCreate(user, userID) {
        let player = this.findPlayer(userID);
        if (player) {
            return player;
        }

        player = new Player({ user, userID });
        player_db.push(player);
        
        return player;
    },

    findPlayer(userID) {
        logger.debug("Finding player with user with ID: "+targetId);
        return player_db.find( p => p.userID === userID);
    },

    getAll() {
        return player_db;
    },

    fetchLeaderboard() {
        let players = this.getAll();
        let leaderboard = players.slice()
            .sort( (a, b) => b.netWorth() - a.netWorth() );
        return leaderboard;
    },

    save(player) {
        if (typeof player === 'array') {
            this.savePlayers(player);
        } else {
            this.savePlayers([player]);
        }
    },

    savePlayers(playerList) {
        player_db = player_db.map(p => {
            let item2 = playerList.find(p2 => p2.userID === p.userID);
            return item2 ? item2 : p;
        });
    }

}