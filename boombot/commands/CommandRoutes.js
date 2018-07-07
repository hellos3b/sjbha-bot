import commands from './commands'
import Table from 'ascii-table'
import GameController from '../game/GameController'
import PlayersDB from '../db/PlayersDB'
import WeeklyDB from '../db/WeeklyDB'
import logger from 'winston'
import Timeout from './Timeout'
import WeeklyController from './WeeklyController'
import Embeds from '../game/Embeds'

import Bots from '../game/bots'

const LEADERBOARD_COUNT = 40;
const LOAN_INTEREST = 0.1;

const _minutes = 60 * 1000;
const _hours = 60 * 60 * 1000;
const START_TIMEOUT = 3 * _hours; // 6 hours
const TURN_TIMEOUT = 30 * _minutes;
const PAY_MATCH_PERCENT = 0.25;

const PLAYER_MAX_COUNT = 8;

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

    [commands.Rules.trigger]: async function({bot, channelID}) {
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
    [commands.Start.trigger]: async function({bot, channelID, user, userID}) {
        Timeout.clear();
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

        if (game.getBuyin() === 20 && game.playerCount() >= 3) {
            let ai = (Math.random() < 0.5) ? Bots.smarty : Bots.smarty;
            let bot1 = await PlayersDB.findOrCreate(ai.user, ai.userID);
            bot1.setBot(ai);
            game.addPlayer(bot1);

            await bot.sendMessage({
                to: channelID,
                message: ai.user + " has also joined!"
            });
        }
        
        game.Start();

        let currentTurn = game.currentTurn();
        let ctp = game.getPlayer(currentTurn.userID);
        ctp.yourTurn({game, bot, channelID, user, userID});

        let msg = game.toString()+"\n";
        msg += game.turnMention();

        let coins = 0;
        Timeout.start(async function() {
            logger.debug("Explode player timeout");
            let currentTurn = game.currentTurn();
            let turnID = currentTurn.userID;
            let t_msg = "";
            let coinsLost = game.removeCoinsFrom(turnID);
            let player = game.getPlayer(turnID);
            game.addPot(coinsLost);

            coins = game.getCoins(turnID);

            player.addBank(coins);
            await PlayersDB.save(player);

            game.removePlayer(turnID);
            let sharedAmount = game.distributePot();

            game.resetRound();
            
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
                WeeklyController.SaveResults( game.getResults() );
                GameController.End();
            } else {
                t_msg += game.toString();
                t_msg += game.turnMention();
            }

            await bot.sendMessage({
                to: channelID,
                message: t_msg
            })
        }, TURN_TIMEOUT);

        return msg;
    },

     // start a game
     [commands.Leaderboard.trigger]: async function({user, userID, message}) {
        let [cmd, type] = message.split(" ");

        // Week parameter
        if (type === "week" || type === "weekly") {
            let result = await this["!weekly"]({user, userID});
            return result;
        }

        let leaderboard = await PlayersDB.fetchLeaderboard();
        leaderboard = leaderboard.slice(0, LEADERBOARD_COUNT);

        if (!leaderboard.length) {
            return "Nobody has played a game yet this season!";
        }

        var table = new Table("Leaderboard");
        // table.setHeading(" ", "name", "net worth", "bank", "games", "survives");
        table.setHeading(" ", "name", "bank", "games", "survives");

        for (var i = 0; i < leaderboard.length; i++) {
            table.addRow(
                i+1, 
                leaderboard[i].name, 
                // leaderboard[i].netWorth(),
                leaderboard[i].getBank(),
                leaderboard[i].getSeasonGames(),
                leaderboard[i].getSeasonSurvives()
            );
        }
        
        return "```\n"+table.toString()+"```";
    },

    [commands.Weekly.trigger]: async function({user, userID}) {
        let leaderboard = await WeeklyController.Leaderboard();
        
        return "```\n"+leaderboard+"```";
    },

    "!n": async function(opt) {
        return this[commands.NewGame.trigger](opt);
    },

    // initiating a new game
    [commands.NewGame.trigger]: async function({bot, channelID, user, userID, message}) {
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

        Timeout.start(async function() {
            logger.debug("New game timeout");
            GameController.End();
            bot.sendMessage({
                to: channelID,
                message: "Cancelling game request, took too long for players to join"
            })
        }, START_TIMEOUT);

        msg = "```py\n" + `@ Starting new game!\nBuyin: ${buyin}`+"```" + `Type \`!join\` to get in on the game!`

        return msg;
    },

    "!j": async function(opt) {
        return this[commands.Join.trigger](opt);
    },

    // Joining a game
    [commands.Join.trigger]: async function({bot, channelID, user, userID}) {
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

        if (game.playerCount === PLAYER_MAX_COUNT) {
            return `Max amount of players have joined. Leader should !start when they're ready`;
        }

        let buyin = game.getBuyin();
        if (player.getBank() < buyin) {
            msg += `Woops, you don't have enough coins to join a game! You have **${player.getBank()}** coins but the buyin is ${buyin}\n`;
            msg += `You can use \`!loan\` to take out a loan`;
            return msg;
        }

        game.addPlayer(player);
        let embed = Embeds.Join({name: player.name});

        await bot.sendMessage({
            to: channelID,
            embed
        });
        msg = "```py\n" + `@ There are now ${game.playerCount()}/${PLAYER_MAX_COUNT} players ready to play!\nBuyin ${buyin} `+ "```" + `Use \`!join\` to get in on the game, or leader can \`!start\` to start the game!`

        return msg;
    },

    [commands.Leave.trigger]: async function({bot, channelID, user, userID}) {
        let msg = "";
        if (!GameController.exists) {
            return `There isn't a game going on`;
        }

        let game = GameController.Game;

        if (game.isActive()) {
            return `Too late to leave, you're stuck now *good luck*`;
        }

        let player = await PlayersDB.findOrCreate(user, userID);

        if (!game.hasPlayer(player)) {
            return `You haven't joined the game yet`
        }

        if (game.isOwner(userID)) {
            return `You can't leave if you started -- You can \`!cancel\` the game if you want to quit`;
        }

        game.removePlayerFromStart(player);

        let buyin = game.getBuyin();
        msg += "You have left the table";
        msg = "```py\n" + `@ There are now ${game.playerCount()}/${PLAYER_MAX_COUNT} players ready to play!\nBuyin ${buyin} `+ "```" + `Use \`!join\` to get in on the game, or leader can \`!start\` to start the game!`

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

    "!c": async function(opt) {
        return this[commands.Click.trigger](opt);
    },

    // click the bomb
    [commands.Click.trigger]: async function({bot, channelID, user, userID}) {
        Timeout.clear();
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
            let coinsLost = game.removeCoinsFrom(userID);
            game.addPot(coinsLost);

            coins = game.getCoins(userID);

            player.addBank(coins);
            await PlayersDB.save(player);

            game.removePlayer(userID);
            let sharedAmount = game.distributePot();

            game.resetRound();

            let profit = coins - game.getBuyin();
            let gameString = game.description();
            let embed = Embeds.Explode({
                name: player.name,
                coinsLeft: coins,
                coinsShared: sharedAmount,
                profit: profit,
                gameString
            });

            await bot.sendMessage({
                to: channelID,
                embed
            });

        } else {
            game.addCoins(userID, pot);
            game.resetPot();
            game.nextTurn();


            let gameString = game.description();

            let embed = Embeds.Click({
                name: player.name,
                potStolen: pot,
                gameString
            });

            await bot.sendMessage({
                to: channelID,
                embed
            });
        }

        if (game.isOver()) {
            let finalPlayer = game.lastPlayer();
            let coins = game.getCoins(finalPlayer.userID);
            finalPlayer.addBank(coins);
            finalPlayer.addSurvive();
            await PlayersDB.save(finalPlayer);
            game.addPlayerResult(finalPlayer);
            msg += `**${finalPlayer.name}** has won the game!\n`;
            msg += game.endGameString();
            WeeklyController.SaveResults( game.getResults() );
            GameController.End();
        } else {
            msg += game.toString(true);
            msg += game.turnMention();

            let currentTurn = game.currentTurn();
            let ctp = game.getPlayer(currentTurn.userID);
            ctp.yourTurn({game, bot, channelID, user, userID});


            // turn timer
            Timeout.start(async function() {
                logger.debug("Explode player timeout");
                let t_msg = "";
                let currentTurn = game.currentTurn();
                let turnID = currentTurn.userID;
                let coinsLost = game.removeCoinsFrom(turnID);
                game.addPot(coinsLost);
    
                coins = game.getCoins(turnID);
    
                player.addBank(coins);
                await PlayersDB.save(player);
    
                game.removePlayer(turnID);
                let sharedAmount = game.distributePot();
    
                game.resetRound();

                t_msg += `🔥🔥BOOOOOOM🔥🔥 **${player.name}** blew up from taking too long\n`; 
                t_msg += `**${sharedAmount}** coins were split between the remaining players\n`;
    
                if (game.isOver()) {
                    let finalPlayer = game.lastPlayer();
                    let coins = game.getCoins(finalPlayer.userID);
                    finalPlayer.addBank(coins);
                    finalPlayer.addSurvive();
                    await PlayersDB.save(finalPlayer);
                    game.addPlayerResult(finalPlayer);
                    t_msg += `**${finalPlayer.name}** has won the game!\n`;
                    t_msg += game.endGameString();
                    WeeklyController.SaveResults( game.getResults() );
                    GameController.End();
                } else {
                    t_msg += game.toString();
                    t_msg += game.turnMention();

                    currentTurn = game.currentTurn();
                    let ctp = game.getPlayer(currentTurn.userID);
                    ctp.yourTurn({game, bot, channelID, user, userID});
                }
    
                await bot.sendMessage({
                    to: channelID,
                    message: t_msg
                })
            }, TURN_TIMEOUT);
        }
        
        return msg;
    },

    "!p": async function(opt) {
        return this[commands.Pass.trigger](opt);
    },

    [commands.Pass.trigger]: async function({bot, channelID, user, userID}) {
        Timeout.clear();
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


        let gameString = game.description();

        let embed = Embeds.Pass({
            name: player.name,
            passCost: passCost,
            gameString
        });

        await bot.sendMessage({
            to: channelID,
            embed
        });

        msg += game.toString(true);
        msg += game.turnMention();

        let currentTurn = game.currentTurn();
        let ctp = game.getPlayer(currentTurn.userID);
        ctp.yourTurn({game, bot, channelID, user, userID});

        Timeout.start(async function() {
            logger.debug("Explode player timeout");
            let currentTurn = game.currentTurn();
            let turnID = currentTurn.userID;
            let t_msg = "";
            let coinsLost = game.removeCoinsFrom(turnID);
            let player = game.getPlayer(turnID);
            game.addPot(coinsLost);

            let coins = 0;
            coins = game.getCoins(turnID);

            player.addBank(coins);
            await PlayersDB.save(player);

            game.removePlayer(turnID);
            let sharedAmount = game.distributePot();

            game.resetRound();
            
            t_msg += `🔥🔥BOOOOOOM🔥🔥 **${player.name}** blew up from taking too long\n`; 
            t_msg += `**${sharedAmount}** coins were split between the remaining players\n`;

            if (game.isOver()) {
                let finalPlayer = game.lastPlayer();
                let coins = game.getCoins(finalPlayer.userID);
                finalPlayer.addBank(coins);
                finalPlayer.addSurvive();
                await PlayersDB.save(finalPlayer);
                game.addPlayerResult(finalPlayer);
                t_msg += `**${finalPlayer.name}** has won the game!\n`;
                t_msg += game.endGameString();
                WeeklyController.SaveResults( game.getResults() );
                GameController.End();
            } else {
                t_msg += game.toString();
                t_msg += game.turnMention();

                let ctp = game.getPlayer(currentTurn.userID);
                ctp.yourTurn({game, bot, channelID, user, userID});
            }

            await bot.sendMessage({
                to: channelID,
                message: t_msg
            })
        }, TURN_TIMEOUT);
        
        return msg;
    },

    "!s": async function(opt) {
        return this[commands.Stats.trigger](opt);
    },

    // initiating a new game
    [commands.Stats.trigger]: async function({channelID, bot, user, userID, message}) {

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
        let rank = -1;
        for (var i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].userID === player.userID) {
                rank = i + 1;
                break;
            }
        }

        // let table = new Table(player.name);
        // table.removeBorder();


        // table.setHeading(" ", "name", "net worth", "bank", "games", "survives");

        // Basic stats
        // var table = new Table(player.name);
        // table.removeBorder();
        // table.setHeading("rank", "bank");
        // table.addRow((rank >= 0) ? rank : "Unranked", json.bank );

        let survive_percent = (json.games === 0) ? "0" : Math.floor(json.survives / json.games * 10000) / 100;
        let season_survive_percent = (json.season_games === 0) ? "0" : Math.floor(json.season_survives / json.season_games * 10000) / 100;

        let rank_str = (rank >= 0) ? rank : "#unranked";
        let trophies = "";
        if (!json.trophies.length) {
            trophies = "# no trophies";
        } else {
            // TODO Fill
            let emojies = {
                "champion": "🏆",
                "second": "🏅",
                "third": "👏"
            };

            trophies = json.trophies.map( t => {
                return emojies[t.type] + " " + t.name
            }).join("\n");
        }
        msg = "```py";
        msg += `
@ ${player.name}
Rank ${rank_str}/${leaderboard.length}
Bank ${json.bank}

@ current season
Games ${json.season_games}
Games Won ${json.season_survives}
Survive% ${season_survive_percent}%

@ all time
Games ${json.games}
Survives ${json.survives}
Survive% ${survive_percent}%

@ trophies
${trophies}`;

        msg += "```";
    

        await bot.sendMessage({
            to: channelID,
            message: msg
        });

        // let embed = Embeds.Stats({
        //     name: player.name,
        //     rank,
        //     bank: json.bank,
        //     games: json.games,
        //     gamesWon: json.survives,
        //     survivalpercent: survive_percent+"%"
        // });

        // await bot.sendMessage({
        //     to: channelID,
        //     embed
        // });
    },

    [commands.History.trigger]: async function({channelID, bot, user, userID, message}) {

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
        

        msg = "```py\n";
        msg += `# ${player.name}\n\n`;

        let history = json.history;
        if (!history.length) {
            msg += "# Player did not play in any previous seasons!```";
            await bot.sendMessage({
                to: channelID,
                message: msg
            });
            return;
        }

        for (var i = 0; i < history.length; i++) {
            let h = history[i];
            let rank_str = (h.rank >= 0) ? h.rank : "unranked";

            let emojies = {
                "champion": "🏆",
                "second": "🏅",
                "third": "👏"
            };

            let trophy = "";
            if (h.rank === 1) {
                trophy = `${emojies.champion} Champion`;
            } else if (h.rank === 2) {
                trophy = `${emojies.second} 2nd Place`;
            } else if (h.rank === 3) {
                trophy = `${emojies.third} 3rd Place`;
            }

            let survive_percent = (json.games === 0) ? "0" : Math.floor(h.survives / h.games * 10000) / 100;
            msg += `@ ${h.season}\n`;

            if (trophy) {
                msg += `${trophy}\n`;
            }

msg += `Rank ${rank_str}/${h.playerCount}
Bank ${h.bank}
Games Played ${h.games}
Survives ${h.survives}
Survive % ${survive_percent}%

`
        }

        msg += "```";
    

        await bot.sendMessage({
            to: channelID,
            message: msg
        });

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

        // amount = Math.floor(amount);
        // let interest = Math.floor(amount * LOAN_INTEREST);

        player.setBank(amount);
        // player.addDebt(amount + interest);
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

        let pay_bonus = Math.floor( amount * PAY_MATCH_PERCENT );
        amount = Math.floor(amount);

        player.removeBank(amount);
        player.removeDebt(amount + pay_bonus);
        await PlayersDB.save(player);

        return `Thanks for paying debt! As a token of appreciation, the house removed an extra ${pay_bonus} coins from your debt.\nYou now have ${player.getBank()} coins available, and are ${player.getDebt()} coins in debt`;
    }
};
