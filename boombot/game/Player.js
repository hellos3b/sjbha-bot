import logger from 'winston'

export default function({ 
    user="",     // Name of the user
    userID,     // The User's discord ID
    bank=40,    // Total number of coins
    debt=0,     // How much debt player has accumulated from loans
    games=0,     // How many games the player has played in
    survives=0
}) {

    if (userID === null) {
        throw "userID is required a field";
    }

    this.userID = userID;
    this.name = user;
    this.mention = "<@!" + userID + ">";


    this.netWorth = function() {
        return bank - debt;
    }

    this.addBank = function(amt) {
        bank += amt;
    }

    this.addSurvive = function() {
        survives++;
    }

    this.getSurvives = function() {
        return survives;
    }

    this.getSurvivePercentage = function() {
        return (Math.floor( (survives / games) * 10000) / 100) + "%";
    }

    this.removeBank = function(amt) {
        bank -= amt;
    }

    this.addGame = function() {
        games++;
    }

    this.getGames = function() {
        return games;
    }

    this.getBank = function() {
        return bank;
    }

    this.addDebt = function(amount) {
        debt += amount;
    }

    this.removeDebt = function(amount) {
        debt -= amount;
    }

    this.getDebt = function() {
        return debt;
    }

    this.toJSON = function() {
        return {
            user, userID, bank, debt, games, survives
        };
    };
}