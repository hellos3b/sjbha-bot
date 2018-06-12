import Table from 'ascii-table'
import Bomb from './Bomb';
import Embeds from './Embeds';

let BONUS_CHANCE = 6;
let BONUS_AMT = 2;

export default function(ownerID, buyin) {

    let players = [];
    let player_results = [];
    let pot = 0;
    let passCost = Math.floor(buyin/4);

    let maxPlayers = 0;
    let lossRisk = 1;
    let lossCoins = 0;

    let bonus = false;

    // game stuff
    let state = "JOIN";
    let turn = -1;
    let playerBank = {};
    let playerLotto = {};
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

    this.isBonus = function() {
        return bonus;
    }

    this.Start = function() {
        this.resetTurn();
        state = "ACTIVE";
        bomb.reset();

        // create money round
        let rng = Math.floor( Math.random() * BONUS_CHANCE );
        bonus = (rng === 3);

        maxPlayers = players.length;
        this.updateLossRisk();

        for (var i = 0; i < players.length; i++) {
            players[i].removeBank(buyin);
            players[i].addGame();

            if (bonus) {
                playerBank[players[i].userID] = buyin*2;
                passCost = Math.floor(buyin/2);
            }
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
            lotto: 1,
            profit: playerBank[player.userID] - buyin
        };
        if (round === 1) {
            result.lotto++;
        }
        console.log("BOMB CLICK COUNT---" + bomb.clickCount());
        if (bomb.clickCount() === 0) {
            result.lotto += 4;
        }
        // If last player, no lottery for u
        if (players.length === 1) {
            result.lotto = 0;
        }
        player_results.push(result);
    }

    this.currentTurn = function() {
        return players[turn];
    }

    this.lowestCoins = function() {
        let coins = Number.POSITIVE_INFINITY;
        let userid = [];
        for (var i = 0; i < players.length; i++) {
            let c = this.getCoins(players[i].userID);
            if (c < coins) {
                userid = [players[i].userID];
                coins = c;
            } else if (c === coins) {
                userid.push(players[i].userID);
            }
        }
        return userid;
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

    this.getPlayers = function() {
        return players;
    }

    this.toString = function(hideCosts) {
        let msg = "";
        let risk = Math.floor(lossRisk * 100);
        
        let gameTable = new Table();
        if (state === "JOIN") {
            msg += `\nWaiting for more players!\nCurrent List:\n`;
            for (var i = 0; i < players.length; i++) {
                gameTable.addRow(players[i].name);
            }
        } else {
            let currentPlayer = this.currentTurn();
            let percent = Math.floor( (1/ (6-bomb.clickCount()) )*1000)/10;

            if (!hideCosts) {

                if (bonus) {
                    msg += "💰💰💰 BONUS ROUND 💰💰💰\n";
                }
                msg += `RISK: ${risk}%  `;
                msg += `| PASS COST: ${passCost} | POT: ${pot}\n`;
                msg += `Current Turn: ${currentPlayer.name}\n`;
                msg += `The bomb has been clicked ${bomb.clickCount()} times (${percent}% chance to explode this turn)\n`;
            }
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

    this.description = function() {
        let risk = Math.floor(lossRisk * 100);
        let currentPlayer = this.currentTurn();
        let percent = Math.floor( (1/ (6-bomb.clickCount()) )*1000)/10;

        let msg = "";
        if (bonus) {
            msg += "💰💰💰 BONUS ROUND 💰💰💰\n";
        }
        msg += `COIN RISK: ${risk}%\n | PASS COST: ${passCost} | POT: ${pot}\n`;
        msg += `The bomb has been clicked ${bomb.clickCount()} times\n(${percent}% chance to explode this turn)\n`;
        return msg;
    }

    this.embed = function() {
        let risk = Math.floor(lossRisk * 100);
        let currentPlayer = this.currentTurn();
        let percent = Math.floor( (1/ (6-bomb.clickCount()) )*1000)/10;
        return Embeds.BombStatus({
            clicks: bomb.clickCount(),
            explodePercent: percent +"%",
            pot,
            risk,
            passCost,
            currentTurn: currentPlayer.name
        });
    }

    this.getRound = function() {
        return round;
    };

    this.endGameString = function() {
        let gameTable = new Table("Results");
        let winner = this.lastPlayer();
        gameTable.setHeading("name", "profit", "round end", "tickets");
        let results = player_results.slice().sort( (a,b) => b.profit - a.profit);

        for (var i = 0; i < results.length; i++) {
            let round = (results[i].userID === winner.userID) ? " " : results[i].round.toString();
            let profit = (results[i].profit > 0) ? "+"+results[i].profit : results[i].profit.toString();
            gameTable.addRow(results[i].name, profit, round, results[i].lotto);
        }

        return "```\n"+gameTable.toString()+"```";
    }

    this.getResults = function() {
        return player_results.slice();
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

    this.clickCount = function() {
        return bomb.clickCount();
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
            amt = Math.floor(coins * lossRisk);
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