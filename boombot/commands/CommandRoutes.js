import commands from './commands'
import Table from 'ascii-table'
import GameController from '../game/GameController'
import PlayersDB from '../db/PlayersDB'

const LEADERBOARD_COUNT = 10;
const LOAN_INTEREST = 0.1;

export default {

    // !ping
    [commands.Ping.trigger]() {
        return "Pong!";
    },

    // !help
    [commands.Help.trigger]() {
        var helpTable = new Table()
        helpTable.removeBorder()

        for (var k in commands) {
            helpTable.addRow(commands[k].trigger, commands[k].description);
        }

        return "```\n"+helpTable.toString()+"```"
    },

    [commands.Rules.trigger]() {
        return "Read rules here: https://gist.github.com/hellos3b/90894df06856ea26607571d5ead0cb0b";
    },

    // start a game
    [commands.Start.trigger]({user, userID}) {
        if (!GameController.exists) {
            return `Can't start a game that doesn't exist! Use \`!new\` to start a new game`;
        }

        let game = GameController.Game;
        if (game.isActive()) {
            return `There is already an active game going on`
        }
        
        if (game.playerCount() < 2) {
            return `You need at least two players to start the game!`
        }

        if (!game.isOwner(userID)) {
            return `Only the person who initiated the game can start it`;
        }

        game.Start();

        let currentTurn = game.currentTurn();
        let msg = game.toString()+"\n";
        msg += game.turnMention();
        return msg;
    },

     // start a game
     [commands.Leaderboard.trigger]({user, userID}) {
        let leaderboard = PlayersDB.fetchLeaderboard().slice(0, LEADERBOARD_COUNT);

        var table = new Table("Leaderboard");
        table.setHeading(" ", "name", "net worth", "games");

        for (var i = 0; i < leaderboard.length; i++) {
            table.addRow(
                i+1, 
                leaderboard[i].name, 
                leaderboard[i].netWorth(),
                leaderboard[i].getGames()
            );
        }
        
        return "```\n"+table.toString()+"```";
    },

    // initiating a new game
    [commands.NewGame.trigger]({user, userID, message}) {
        let msg = "";
        let [cmd, buyin] = message.split(" ");
        buyin = buyin || 20;

        if (GameController.exists) {
            return `Can't start a new game because there's already one active!`;
        }

        let player = PlayersDB.findOrCreate(user, userID);
        if (player.getBank() < buyin) {
            msg += `Woops, you don't have enough coins to start that game! You have ${player.getBank()} but the buyin is ${buyin}\n`;
            msg += `You can use \`!loan\` to take out a loan`;
            return msg;
        }

        GameController.Start(userID, buyin);
        let game = GameController.Game;

        game.addPlayer(player);

        msg = `Starting new game! Type \`!join\` to get in on the game!`

        return msg;
    },

    // Joining a game
    [commands.Join.trigger]({user, userID}) {
        let msg = "";
        if (!GameController.exists) {
            return `There is no active game you can join! Try starting a new one with \`!new\`?`;
        }

        let game = GameController.Game;

        if (game.isActive()) {
            return `Too late to join :( Try !join -ing on the next one!`;
        }

        let player = PlayersDB.findOrCreate(user, userID);

        if (game.hasPlayer(player)) {
            return `Oops! You're already set to play in this game!`
        }

        let buyin = game.getBuyin();
        if (player.getBank() < buyin) {
            msg += `Woops, you don't have enough coins to join a game! You have **${player.getBank()}** coins but the buyin is ${buyin}\n`;
            msg += `You can use \`!loan\` to take out a loan`;
            return msg;
        }

        game.addPlayer(player);
        msg = `There are now ${game.playerCount()} players waiting to play. Use \`!join\` to get in on the game, or \`!start\` to start the game!`

        return msg;
    },

    // Joining a game
    [commands.Current.trigger]({user, userID}) {
        if (!GameController.exists) {
            return `There is no active game going on.\nUse \`!new\` to initiate a game!`;
        }

        let game = GameController.Game;

        return game.toString();
    },

    // click the bomb
    [commands.Click.trigger]({user, userID}) {
        let msg = "";
        if (!GameController.active) {
            return `There is no active game going.`;
        }

        let game = GameController.Game;
        if (!game.isCurrentTurn(userID)) {
            return `It's not your turn!`;
        }

        let player = game.getPlayer(userID),
            coins = 0,
            pot = game.getPot();

        // Click the bomb!
        let bomb = game.click();

        if (bomb.isExploded()) {
            let coinsLost = game.removeCoinsFrom(userID, game.getBuyin() );
            game.addPot(coinsLost);

            coins = game.getCoins(userID);

            player.addBank(coins);
            PlayersDB.save(player);

            game.removePlayer(userID);
            let sharedAmount = game.distributePot();

            game.resetRound();

            msg += `🔥🔥BOOOOOOM🔥🔥 goodbye **${player.name}**! `; 
            msg += `You are leaving the table with **${coins}** coins\n`;
            msg += `**${sharedAmount}** coins were split between the remaining players\n`;
        } else {
            game.addCoins(userID, pot);
            game.resetPot();
            game.nextTurn();

            msg += `*CLICK* **${player.name}** is safe!\n`;
            msg += (pot > 0) ? `They stole **${pot}** coins from the pot\n` : "";
        }

        if (game.isOver()) {
            let finalPlayer = game.lastPlayer();
            let coins = game.getCoins(finalPlayer.userID);
            finalPlayer.addBank(coins);
            PlayersDB.save(finalPlayer);
            game.addPlayerResult(finalPlayer);
            msg += `**${finalPlayer.name}** has won the game!\n`;
            msg += game.endGameString();
            GameController.End();
        } else {
            msg += game.toString();
            msg += game.turnMention();
        }
        
        return msg;
    },

    [commands.Pass.trigger]({user, userID}) {
        let msg = "";
        if (!GameController.active) {
            return `There is no active game going. Try starting one with \`!new\``;
        }

        let game = GameController.Game;
        if (!game.isCurrentTurn(userID)) {
            return `It's not your turn!`;
        }

        let player = game.getPlayer(userID),
            coins = game.getCoins(userID),
            passCost = game.getPassCost();

        if (coins < passCost) {
            return `You don't have enough coins to pass, you have to \`!click\``;
        }

        game.removeCoinsFrom(userID, passCost);
        game.addPot(passCost);
        game.nextTurn();

        msg += `**${player.name}** pays **${passCost}** coins to pass the bomb.\n`;

        msg += game.toString();
        msg += game.turnMention();
        
        return msg;
    },

    // initiating a new game
    [commands.Stats.trigger]({user, userID, message}) {

        let [cmd, mention] = message.split(" ");
        let targetId = userID;
        if (mention) {
            targetId = mention.replace("<@","").replace(">","");
        }

        let msg = "";
        let player = PlayersDB.findPlayer(targetId);

        if (!player) {
            return `Sorry, I couldn't find any info for that person. They may have not played a game yet.`;
        }

        let json = player.toJSON();
        let leaderboard = PlayersDB.fetchLeaderboard();
        let rank = 0;
        for (var i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].userID === player.userID) {
                rank = i + 1;
                break;
            }
        }

        let table = new Table(player.name);
        // table.removeBorder();

        table.addRow("Games Played", json.games);
        table.addRow("Net Worth", player.netWorth());
        table.addRow("Rank", rank);
        table.addRow("Bank", json.bank);
        table.addRow("Debt", json.debt);

        return "```\n"+table.toString()+"```";
    },

    [commands.Loan.trigger]({user, userID, message}) {
        let [cmd, amountStr] = message.split(" ");
        let player = PlayersDB.findOrCreate(user, userID);
        let amount = 40;

        let bank = player.getBank();

        if (bank >= 20) {
            return `You don't need a loan, you have enough coins to play a game`;
        }
        // let amount = parseInt(amountStr);

        // if (isNaN(amount)) {
        //     return `That is not a valid amount`;
        // }

        // if (amount <= 0) {
        //     return `Please enter amount that's greater than 0`;
        // }

        // if (amount > 1000) {
        //     return `The largest amount we can offer is 1,000`;
        // }

        amount = Math.floor(amount);
        let interest = Math.floor(amount * LOAN_INTEREST);

        player.addBank(amount);
        player.addDebt(amount + interest);
        PlayersDB.save(player);

        return `You now have ${player.getBank()} coins available (and are ${player.getDebt()} coins in debt)`;
    },

    [commands.Pay.trigger]({user, userID, message}) {
        let [cmd, amountStr] = message.split(" ");
        let player = PlayersDB.findOrCreate(user, userID);
        let amount = parseInt(amountStr);

        if (isNaN(amount)) {
            return `That is not a valid amount`;
        }

        if (amount <= 0) {
            return `Please enter an amount that's greater than 0`;
        }

        if (amount > player.getBank()) {
            return `You don't have enough in your bank to pay that much`;
        }

        amount = Math.floor(amount);

        player.removeBank(amount);
        player.removeDebt(amount);
        PlayersDB.save(player);

        return `You now have ${player.getBank()} coins available, and are ${player.getDebt()} coins in debt`;
    }
};
