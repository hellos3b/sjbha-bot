import SeasonsDB from '../db/SeasonsDB'
import PlayersDB from '../db/PlayersDB'

export default {

    endSeason: async function(bot) {
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
        let champion = {}, 
            second = {}, 
            third = {};
        // 2 - give players trophies
        for (var i = 0; i < leaderboard.length; i++) {
            console.log("giving history");
            let player = leaderboard[i];
            let bank = player.getBank();
            let rank = (player.getBank() > 40) ? i + 1 : -1;
            player.seasonReset(name, rank, leaderboard.length);

            if (i === 0) {
                player.addTrophy(`${name} Champion`, "champion");
                champion = {
                    name: player.name,
                    bank: bank
                };
            } else if (i === 1) {
                player.addTrophy(`${name} 2nd Place`, "second");
                second = {
                    name: player.name,
                    bank: bank
                };
            } else if (i === 2) {
                player.addTrophy(`${name} 3rd Place`, "third");
                third = {
                    name: player.name,
                    bank: bank
                };
            }

            let json = player.toJSON();
            json.active = false;
            results.push(json);
            console.log("hist", json);
        }


        await bot.sendMessage({
            to: "432766496700235776",
            embed: {
                "title": `End of ${name}`,
                "description": "Season is over, here's the trophies!",
                "color": 8580042,
                "thumbnail": {
                  "url": "https://imgur.com/q90ytxR.png"
                },
                "fields": [
                  {
                    "name": `🏆 1st Place: ${champion.bank} coins` ,
                    "value": champion.name
                  },
                  {
                    "name": `🏅 2nd Place: ${second.bank} coins`,
                    "value": second.name
                  },
                  {
                    "name": `👏 3rd Place: ${third.bank} coins`,
                    "value": third.name
                  }
                ]
            }
        });

        PlayersDB.savePlayers(results);
    },

    currentSeasonName: async function() {
        let seasons = await SeasonsDB.getSeasons();
        return "Season " + seasons.length;
    }

}