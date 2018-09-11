import logger from 'winston'
import router from '../router'

export default function({ 
    user="",     // Name of the user
    userID,     // The User's discord ID
    bank=40,    // Total number of coins
    debt=0,     // How much debt player has accumulated from loans
    games=0,     // How many games the player has played in
    survives=0,
    active=false,
    season_games=0,
    season_survives=0,
    trophies=[],
    history=[]
}) {
    let isBot = false;
    let bot_delay = 7000;
    let botAI = {};

    if (userID === null) {
        throw "userID is required a field";
    }

    this.userID = userID;
    this.name = user;
    this.mention = "<@!" + userID + ">";

    this.setBot = function(AI) {
        isBot = true;
        botAI = AI;
        this.mention = user;
    }

    this.isABot = function() {
        return isBot;
    }

    this.isActive = function() {
        return active;
    }

    this.yourTurn = function({game, bot, channelID}) {
        if (!isBot) {
            return;
        }
        setTimeout(() => this.botTurn({game, bot, channelID}), bot_delay);
    }

    this.botTurn = async function({game, bot, channelID}) {
        let command = "!click";
        let coins = game.getCoins(userID);
        if (coins >= game.getPassCost()) {
            console.log("[bot] Checking turn");
            command = botAI.turn(game, this);
        } else {
            console.log("[bot] Not enough coins!");
        }

        let context = {
            bot, channelID, user, userID,
            message: command
        };
        await bot.sendMessage({
            to: channelID,
            message: "> " + user + " " + command
        })

        router.router(context);
    }

    this.netWorth = function() {
        return bank - debt;
    }

    this.addBank = function(amt) {
        bank += amt;
    }

    this.addSurvive = function() {
        survives++;
        season_survives++;
    }

    this.getSurvives = function() {
        return survives;
    }

    this.getSeasonSurvives = function() {
        return season_survives;
    }

    this.getSeasonGames = function() {
        return season_games;
    }

    this.getSurvivePercentage = function() {
        if (games === 0) {
            return "0%"
        }
        return (Math.floor( (survives / games) * 10000) / 100) + "%";
    }

    this.removeBank = function(amt) {
        bank -= amt;
    }

    this.addGame = function() {
        games++;
        season_games++;
    }

    this.getGames = function() {
        return games;
    }

    this.getBank = function() {
        return bank;
    }

    this.setBank = function(amt) {
        bank = amt;
    }

    this.addDebt = function(amount) {
        debt += amount;
    }

    this.removeDebt = function(amount) {
        debt -= amount;
        if (debt < 0) {
            debt = 0;
        }
    }

    this.getDebt = function() {
        return debt;
    }

    this.addTrophy = function(name, type) {
        console.log("trophies", trophies);
        trophies.push({name, type});
    };

    this.seasonReset = function(seasonName, rank, playerCount) {
        let hist = {
            season: seasonName,
            bank, 
            games,
            survives,
            rank,
            playerCount
        };
        history.push(hist);
        bank = 40;
        season_games = 0;
        season_survives = 0;
    }

    this.toJSON = function() {
        return {
            user, userID, bank, debt, games, survives,
            season_games, season_survives, trophies, history,
            active: true
        };
    };
}