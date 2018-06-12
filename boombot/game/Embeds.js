export default {

    BombStatus({clicks, explodePercent, pot, risk, passCost, currentTurn}) {
        return {
              "description":  `The bomb has been clicked **${clicks}** times (${explodePercent} chance to explode)`,
              "color": 15959851,
            //   "thumbnail": {
            //     "url": "https://imgur.com/SBuEiNS.png"
            //   },
              "fields": [
                {
                  "name": "Pot",
                  "value": pot.toString(),
                  "inline": true
                },
                {
                  "name": "Risk",
                  "value": risk,
                  "inline": true
                },
                {
                  "name": "Pass Cost",
                  "value": passCost.toString(),
                  "inline": true
                },
                {
                  "name": "Current Turn",
                  "value": currentTurn
                }
              ]
        }
    },

    Click({name, potStolen, gameString}) {
        let embed = {
                "color": 6482025,
                "author": {
                "name": `${name} clicks`,
                "icon_url": "https://imgur.com/Kif592I.png"
                }
            };

        if (potStolen > 0) {
            embed.description = `Stole ${potStolen} coins from the pot\n` + "```" + gameString + "```";
        } else {
            embed.description = "```" + gameString + "```";
        }

        return embed;
    },

    Pass({name, passCost, gameString}) {
        return {
            "color": 9101277,
            "author": {
              "name": `${name} pays ${passCost} to pass the bomb`,
              "icon_url": "https://imgur.com/JMBi3mS.png"
            },
            "description": "```" + gameString + "```"
        };
    },

    Explode({name, coinsLeft, profit, coinsShared, gameString}) {
        return {
            "color": 16646144,
            "author": {
            "name": `RIP ${name}`,
            "icon_url": "https://imgur.com/JOJtmjB.png"
            },
            "description": `🔥🔥🔥🔥🔥🔥🔥\nLeaving the table with ${coinsLeft} coins\nProfit: ${profit}, Coins Split: ${coinsShared}\n\n` + 
                "```" + gameString + "```"
        };
    },

    Stats({name, rank, bank, games, gamesWon, survivalpercent}) {
        return {
            "author": {
              "name": name,
              "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
            },
            "fields": [
              {
                "name": "Rank",
                "value": rank.toString(),
                "inline": true
              },
              {
                "name": "Bank",
                "value": bank.toString(),
                "inline": true
              },
              {
                "name": "Games Played",
                "value": games.toString()
              },
              {
                "name": "Games Won",
                "value": gamesWon.toString(),
                "inline": true
              },
              {
                "name": "Survival %",
                "value": survivalpercent,
                "inline": true
              }
            ]
        };
    },

    Join({name}) {
        return {
            "author": {
                "name": `${name} has joined the game!`,
                "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
            }
        }
    },

    Weekly({first, second, lotto, loser, firstcoins, secondcoins, lottocoins, losercoins}) {
        return {
              "title": "Weekly Challenge Results",
              "description": "The weekly challenge is over, time for a reset - These are the people that have won fresh coins!",
              "color": 8580042,
              "thumbnail": {
                "url": "https://imgur.com/q90ytxR.png"
              },
              "fields": [
                {
                  "name": `1st Place (+${firstcoins})` ,
                  "value": first
                },
                {
                  "name": `2nd Place (+${secondcoins})`,
                  "value": second
                },
                {
                  "name": `Pity Prize (+${losercoins})`,
                  "value": loser
                },
                {
                  "name": `Lotto Winner (+${lottocoins})`,
                  "value": lotto
                }
              ]
          };
    }

}