import SeasonsDB from '../db/SeasonsDB'
import PlayersDB from '../db/PlayersDB'

export default {

    endSeason: async function() {
        console.log("Ending season!");
        // 1 - store current leaderboard
        let leaderboard = await PlayersDB.fetchLeaderboard();
        let name = await this.currentSeasonName();
        console.log("Season name", name);
        let season = {
            name,
            leaderboard: leaderboard.map(p => p.toJSON())
        };
        await SeasonsDB.saveSeason(season);

        let results = [];
        // 2 - give players trophies
        for (var i = 0; i < leaderboard.length; i++) {
            console.log("giving history");
            let player = leaderboard[i];
            let rank = (player.getBank() > 40) ? i + 1 : -1;
            player.seasonReset(name, rank, leaderboard.length);

            if (i === 0) {
                player.addTrophy(`${name} Champion`, "champion");
            } else if (i === 1) {
                player.addTrophy(`${name} 2nd Place`, "second");
            } else if (i === 2) {
                player.addTrophy(`${name} 3rd Place`, "third");
            }

            let json = player.toJSON();
            json.active = false;
            results.push(json);
            console.log("hist", json);
        }

        PlayersDB.savePlayers(results);
    },

    currentSeasonName: async function() {
        let seasons = await SeasonsDB.getSeasons();
        return "Season " + seasons.length;
    }

}