import WeeklyDB from './WeeklyDB'
let players = {};

export default {

    async initPlayer(player) {
        let player = await WeeklyDB.findOrCreate(player.name, player.userID);
        players[player.userID] = player;
    },

    async addTickets(player, amt) {
        if (!players[player.userID]) {
            await this.initPlayer(player);
        }
        players[player.userID].tickets += amt;
    },

    async addProfit(player, amt) {
        if (!players[player.userID]) {
            await this.initPlayer(player);
        }
        players[player.userID].profit += amt;
    },

    async Save() {
        for (var k in players) {
            players[k].save();
        }
    }

}