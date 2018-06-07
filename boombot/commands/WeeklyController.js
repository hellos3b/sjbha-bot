import WeeklyDB from '../db/WeeklyDB'
import PlayersDB from '../db/PlayersDB'
import Table from 'ascii-table'
let players = {};

let amounts = {
    first: 60,
    second: 40,
    lotto: 60,
    loser: 20
};

export default {

    async SaveResults(players) {
        for (var i = 0; i < players.length; i++) {
            if (players[i].userID !== "BOT2") {
                await this.SaveResult(players[i]);
            }
        }
    },

    async SaveResult(playerResult) {
        console.log("Saving result", playerResult);
        let player = await WeeklyDB.findOrCreate(playerResult.name, playerResult.userID);
        console.log("--> Player ", player);
        player.profit += playerResult.profit;
        player.lottery = playerResult.lotto + 1;
        await WeeklyDB.savePlayer(player);
    },

    async EndWeek(bot) {
        let results = await this.GetResults();

        if (!results) {
            await bot.sendMessage({
                to: "432766496700235776",
                message: "End of Weekly Challenge!\n" +
                    "Nobody played this week :("
            });
        }

        console.log("Weekly Results");
        console.log(results);

        // Save results [-- Disabled for first week]
        // await this.SaveResultsDB(results);

        // Send results
        var table = new Table("Weekly Results");
        table.addRow("1st Place Winner", results.first.user, `+${amounts.first} coins`);
        table.addRow("2nd Place Winner", results.second.user, `+${amounts.second} coins`);
        if (results.loser) {
            table.addRow("Pity Coins", results.loser.user, `+${amounts.loser} coins`);
        }
        table.addRow("Lottery Winner", results.lotto.user, `+${amounts.lotto} coins`)

        let leaderboard = await this.Leaderboard();
        await bot.sendMessage({
            to: "432766496700235776",
            message: "End of Weekly Challenge!\n" +
                "```"+leaderboard+"```\n" +
                "```"+table.toString()+"```"
        });

        // Clear DB
        await WeeklyDB.clearBoard();
    },

    async SaveResultsDB(results) {
        console.log(`[Weekly] Giving 1st ${results.first.user} ${amounts.first} coins`);
        let first = await PlayersDB.findPlayer(results.first.userID);
        first.addBank(amounts.first);
        await PlayersDB.save(first);

        console.log(`[Weekly] Giving 2nd ${results.second.user} ${amounts.second} coins`);
        let second = await PlayersDB.findPlayer(results.second.userID);
        second.addBank(amounts.second);
        await PlayersDB.save(second);

        console.log(`[Weekly] Giving lotto ${results.lotto.user} ${amounts.lotto} coins`);
        let lotto = await PlayersDB.findPlayer(results.lotto.userID);
        lotto.addBank(amounts.lotto);
        await PlayersDB.save(lotto);

        console.log(`[Weekly] Giving loser ${results.loser.user} ${amounts.loser} coins`);
        if (results.loser) {
            let loser = await PlayersDB.findPlayer(results.loser.userID);
            loser.addBank(amounts.loser);
            await PlayersDB.save(loser);
        }
    },

    async Leaderboard() {
        let leaderboard = await WeeklyDB.fetchLeaderboard();
        if (leaderboard.length === 0) {
            return "Nobody has played a game yet";
        }

        leaderboard = leaderboard.slice(0, leaderboard.length);

        var table = new Table("Weekly Leaderboard");
        table.setHeading(" ", "name", "profit", "lottery");

        for (var i = 0; i < leaderboard.length; i++) {
            let profit = leaderboard[i].profit;
            table.addRow(
                i+1, 
                leaderboard[i].user, 
                profit,
                leaderboard[i].lottery
            );
        }

        return table.toString();
    },

    async GetResults() {
        let leaderboard = await WeeklyDB.fetchLeaderboard();
        if (leaderboard.length === 0) {
            return null;
        }
        let lotto = [];
        for (var i = 0; i < leaderboard.length; i++) {
            for (var j = 0; j < leaderboard[i].lottery; j++) {
                lotto.push(leaderboard[i]);
            }
        }
        let rng = Math.floor( Math.random() * lotto.length );
        let winner = lotto[rng];
        let result = {
            "first": leaderboard[0],
            "second": leaderboard[1],
            "lotto": winner
        };

        if (lotto.length > 2) {
            result.loser = leaderboard[ leaderboard.length - 1];
        }

        return result;
    }

}