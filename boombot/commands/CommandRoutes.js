import commands from './commands'
import Table from 'ascii-table'
import GameController from '../game/GameController'
import PlayersDB from '../db/PlayersDB'
import logger from 'winston'
import Timeout from './Timeout'

const LEADERBOARD_COUNT = 10;
const LOAN_INTEREST = 0.1;

const START_TIMEOUT = 1 * 15 * 1000; // 5 minutes
const TURN_TIMEOUT = 1 * 15 * 1000; // 5 minutes

export default {

    // !ping
    [commands.Ping.trigger]: async function({ bot, channelID}) {
        bot.sendMessage({
            to: channelID,
            message: "Pong!"
        });
    },

    // !help
    [commands.Help.trigger]: async function() {
        var helpTable = new Table()
        helpTable.removeBorder()

        logger.debug("Generating table");
        for (var k in commands) {
            helpTable.addRow(commands[k].trigger, commands[k].description);
        }

        bot.sendMessage({
            to: channelID,
            message: "```\n"+helpTable.toString()+"```"
        });
    },

    [commands.Rules.trigger]: async function() {
        bot.sendMessage({
            to: channelID,
            message: "Read rules here: https://gist.github.com/hellos3b/90894df06856ea26607571d5ead0cb0b"
        });
    },

    [commands.Cancel.trigger]: async function({user, userID}) {
        if (!GameController.exists) {
            return `No active game to cancel`;
        }

        let game = GameController.Game;
        if (game.isActive()) {
            return `It's too late to cancel the game`
        }

        if (!game.isOwner(userID)) {
            return `Only the person who initiated the game can cancel it`;
        }

        GameController.End();

        return "Cancelled the new game. Use `!new` to start a new game";
    },

    // start a game
    [commands.Start.trigger]: async function({user, userID}) {
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

        Timeout.start( () => {
            GameController.End();
            bot.sendMessage({
                to: channelID,
                msg: "Cancelling game request, took too long for players to join"
            })
        }, START_TIMEOUT);

        return msg;
    },

     // start a game
     [commands.Leaderboard.trigger]: async function({user, userID}) {
        let leaderboard = await PlayersDB.fetchLeaderboard();
        leaderboard = leaderboard.slice(0, LEADERBOARD_COUNT);

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
    [commands.NewGame.trigger]: async function({user, userID, message}) {
        let msg = "";
        let [cmd, buyin] = message.split(" ");
        if (!buyin) {
            buyin = 20;
        } else {
            buyin = parseInt(buyin);
        }
        let player = await PlayersDB.findOrCreate(user, userID);

        if (isNaN(buyin)) {
            return `That is not a valid amount for the buyin`;
        }

        if (buyin < 5) {
            return `Buyin needs to be at least 5 coins`;
        }

        if (GameController.exists) {
            return `Can't start a new game because there's already one active!`;
        }

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
    [commands.Join.trigger]: async function({user, userID}) {
        let msg = "";
        if (!GameController.exists) {
            return `There is no active game you can join! Try starting a new one with \`!new\`?`;
        }

        let game = GameController.Game;

        if (game.isActive()) {
            return `Too late to join :( Try !join -ing on the next one!`;
        }

        let player = await PlayersDB.findOrCreate(user, userID);

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
    [commands.Current.trigger]: async function({user, userID}) {
        if (!GameController.exists) {
            return `There is no active game going on.\nUse \`!new\` to initiate a game!`;
        }

        let game = GameController.Game;

        return game.toString();
    },

    // click the bomb
    [commands.Click.trigger]: async function({user, userID}) {
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

        const explodePlayer =  async function() {
            let coinsLost = game.removeCoinsFrom(userID, game.getBuyin() );
            game.addPot(coinsLost);

            coins = game.getCoins(userID);

            player.addBank(coins);
            await PlayersDB.save(player);

            game.removePlayer(userID);
            let sharedAmount = game.distributePot();

            game.resetRound();
        }

        if (bomb.isExploded()) {
            await explodePlayer();

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
            await PlayersDB.save(finalPlayer);
            game.addPlayerResult(finalPlayer);
            msg += `**${finalPlayer.name}** has won the game!\n`;
            msg += game.endGameString();
            GameController.End();
        } else {
            msg += game.toString();
            msg += game.turnMention();

            // turn timer
            Timeout.start(async function() {
                let t_msg = "";
                explodePlayer();
                t_msg += `🔥🔥BOOOOOOM🔥🔥 **${player.name}** blew up from taking too long\n`; 
                t_msg += `**${sharedAmount}** coins were split between the remaining players\n`;
    
                if (game.isOver()) {
                    let finalPlayer = game.lastPlayer();
                    let coins = game.getCoins(finalPlayer.userID);
                    finalPlayer.addBank(coins);
                    await PlayersDB.save(finalPlayer);
                    game.addPlayerResult(finalPlayer);
                    t_msg += `**${finalPlayer.name}** has won the game!\n`;
                    t_msg += game.endGameString();
                    GameController.End();
                } else {
                    t_msg += game.toString();
                    t_msg += game.turnMention();
                }
    
                bot.sendMessage({
                    to: channelID,
                    message: t_msg
                })
            }, TURN_TIMEOUT);
        }
        
        return msg;
    },

    [commands.Pass.trigger]: async function({user, userID}) {
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
    [commands.Stats.trigger]: async function({user, userID, message}) {

        let [cmd, mention] = message.split(" ");
        let targetId = userID;
        if (mention) {
            targetId = mention.replace("<@!","")
                .replace("<@","")
                .replace(">","");
        }

        let msg = "";
        let player = await PlayersDB.findPlayer(targetId);

        if (!player) {
            return `Sorry, I couldn't find any info for that person. They may have not played a game yet.`;
        }

        let json = player.toJSON();
        let leaderboard = await PlayersDB.fetchLeaderboard();
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

    [commands.Loan.trigger]: async function({user, userID, message}) {
        let [cmd, amountStr] = message.split(" ");
        let player = await PlayersDB.findOrCreate(user, userID);
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
        await PlayersDB.save(player);

        return `You now have ${player.getBank()} coins available (and are ${player.getDebt()} coins in debt)`;
    },

    [commands.Pay.trigger]: async function({user, userID, message}) {
        let [cmd, amountStr] = message.split(" ");
        let player = await PlayersDB.findOrCreate(user, userID);
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
        await PlayersDB.save(player);

        return `You now have ${player.getBank()} coins available, and are ${player.getDebt()} coins in debt`;
    }
};
