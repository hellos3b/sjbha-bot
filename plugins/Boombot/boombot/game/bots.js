export default {
    dice: {
        userID: "BOT1",
        user: "🤖 dice",
        turn(game, player) {
            console.log("RNG YO ", passRisk);
            let rng = Math.random();
            let command = (rng <= 0.5) ? "!pass" : "!click";
            return command;
        }
    },
    smarty: {
        userID: "BOT2",
        user: "🤖 Cortana",
        turn(game, player) {
            let command = "!click";
            let rng = Math.random() * 100;
            let passRisk = 0;
            let pot = game.getPot();
            let players = game.getPlayers();
            let isLowest = game.lowestCoins().has(player.userID);

            let clicks = game.clickCount();
            console.log("ROUND: ", clicks);

            switch (clicks) {
                case 0:
                    console.log("[bot] Low risk check");
                    passRisk = 5;
                    break;
                case 1:
                    passRisk = 10;
                    if (pot > 0) {
                        console.log("[bot] Going for pot");
                        passRisk = 0;
                    }
                    break;
                case 2:
                    passRisk = 15;
                    if (pot > 0) {
                        console.log("[bot] Going for pot");
                        passRisk = 10;
                    }
                    break;
                case 3:
                    passRisk = 40;
                    if (pot == 5) {
                        passRisk = 10;
                    } else if (pot >= 10) {
                        passRisk = 0;
                    }

                    break;
                case 4:
                    passRisk = 60;
                    if (pot == 5) {
                        passRisk = 50;
                    } else if (pot == 10) {
                        passRisk = 30;
                    } else if (pot > 10) {
                        passRisk = 15;
                    }

                    if (isLowest) {
                        if (pot >= 10) {
                            passRisk = 0;
                        } else {
                            passRisk = 100;
                        }
                    }

                    break;
                case 5:
                    passRisk = 100;

                    if (isLowest) {
                        console.log("[bot] Lowest coins, killing myself");
                        passRisk = -100;
                    }
                    break;
            }

            if (game.getPlayers().length > 3) {
                console.log("[bot] Increasing pass risk");
                passRisk += 5;
            }

            if (isLowest) {
                console.log("[bot] Am lowest, decreasing pass risk");
                passRisk -= 10;
            }

            console.log("PASS RISK", passRisk);
            if (rng <= passRisk) {
                command = "!pass";
            }
            return command;
        }
    }
}