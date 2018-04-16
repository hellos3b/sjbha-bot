import Table from 'ascii-table'
import Bomb from './Bomb';

export default function(ownerID, buyin) {

    let players = [];
    let player_results = [];
    let pot = 0;
    let passCost = Math.floor(buyin/4);

    let maxPlayers = 0;
    let lossRisk = 1;

    // game stuff
    let state = "JOIN";
    let turn = -1;
    let playerBank = {};
    let bomb = new Bomb();
    let round = 1;

    this.updateLossRisk = function() {
        lossRisk = players.length / maxPlayers;    
    };

    this.addPlayer = function(player) {
        players.push(player);
        playerBank[player.userID] = buyin;
    }

    this.isOwner = function(userID) {
        return ownerID === userID;
    }

    this.playerCount = function() {
        return players.length;
    }

    this.isActive = function() {
        return state !== "JOIN";
    }

    this.hasPlayer = function(player) {
        return !!players.find(p => p.userID === player.userID);
    }

    this.lastPlayer = function() {
        return players[players.length - 1];
    }

    this.isOver = function() {
        return players.length === 1;
    }

    this.Start = function() {
        this.resetTurn();
        state = "ACTIVE";
        bomb.reset();

        maxPlayers = players.length;
        this.updateLossRisk();

        for (var i = 0; i < players.length; i++) {
            players[i].removeBank(buyin);
            players[i].addGame();
        }
    }

    this.resetTurn = function() {
        turn = Math.floor(Math.random()*players.length);
        return turn;
    }

    this.getPlayer = function(userID) {
        return players.find(p => p.userID === userID);
    }

    this.nextTurn = function() {
        turn = (turn + 1) % players.length;
    }

    this.removePlayer = function(userID) {
        for (var i = players.length -1; i >= 0; i--) {
            if (players[i].userID === userID) {
                let player = players[i];
                this.addPlayerResult(player);
                players.splice(i, 1);
            }
        }
    }

    this.addPlayerResult = function(player) {
        let result = {
            name: player.name,
            userID: player.userID,
            round,
            profit: playerBank[player.userID] - buyin
        };
        player_results.push(result);
    }

    this.currentTurn = function() {
        return players[turn];
    }

    this.getCoins = function(userID) {
        return playerBank[userID];
    }

    this.addCoins = function(userID, amount) {
        playerBank[userID] += amount;
    }

    this.isCurrentTurn = function(userID) {
        return this.currentTurn().userID === userID;
    }

    this.toString = function() {
        let msg = "";
        let risk = Math.floor(lossRisk * 100);
        msg += `RISK: ${risk}%  `;
        
        let gameTable = new Table();
        if (state === "JOIN") {
            msg += `\nWaiting for more players!\nCurrent List:\n`;
            for (var i = 0; i < players.length; i++) {
                gameTable.addRow(players[i].name);
            }
        } else {
            let currentPlayer = this.currentTurn();
            let percent = Math.floor( (1/ (6-bomb.clickCount()) )*1000)/10;
            msg += `| PASS COST: ${passCost} | POT: ${pot}\n`;
            msg += `Current Turn: ${currentPlayer.name}\n`;
            msg += `The bomb has been clicked ${bomb.clickCount()} times (${percent}% chance to explode this turn)\n`;
            gameTable.setHeading('turn', 'player', 'coins');

            for (var i = 0; i < players.length; i++) {
                let turn = (players[i].userID === currentPlayer.userID ? ">" : "");
                let coins = this.getCoins(players[i].userID);
                gameTable.addRow(turn, players[i].name, coins);
            }
        }

        msg += gameTable.toString();
        return "```\n"+msg+"```";
    }

    this.endGameString = function() {
        let gameTable = new Table("Results");
        let winner = this.lastPlayer();
        gameTable.setHeading("name", "profit", "round end");
        let results = player_results.slice().sort( (a,b) => b.profit - a.profit);

        for (var i = 0; i < results.length; i++) {
            let round = (results[i].userID === winner.userID) ? "⭐" : results[i].round.toString();
            let profit = (results[i].profit > 0) ? "+"+results[i].profit : results[i].profit.toString();
            gameTable.addRow(results[i].name, profit, round);
        }

        return "```\n"+gameTable.toString()+"```";
    }

    this.Bomb = function() {
        return bomb;
    }

    this.turnMention = function() {
        let currentTurn = this.currentTurn();
        return "It's your turn, " + currentTurn.mention + "!";
    }

    this.click = function(userID) {
        let exploded = bomb.click();
        return bomb;
    }

    this.getPot = function() {
        return pot;
    }

    this.addPot = function(amt) {
        pot += amt;
    }

    this.getBuyin = function() {
        return buyin;
    }

    this.getPassCost = function() {
        return passCost;
    }

    // returns the amount of coins that were removed
    this.removeCoinsFrom = function(userID, amt) {
        let coins = playerBank[userID];

        if (!amt) {
            amt = coins * lossRisk;
        }

        if (coins < amt) {
            playerBank[userID] = 0;
            return coins;
        } else {
            playerBank[userID] = coins - amt;
            return amt;
        }
    }

    this.resetPot = function() {
        pot = 0;
    }

    this.resetRound = function() {
        this.resetPot();
        bomb.reset();
        this.resetTurn();
        this.updateLossRisk();
        round++;
    }

    this.distributePot = function() {
        let shared = this.distributeCoins(pot);
        this.resetPot();
        return shared;
    }

    this.distributeCoins = function(amount) {
        let shared = Math.floor(amount/players.length);
        for (var k in playerBank) {
            this.addCoins(k, shared);
        }
        return shared;
    }
}