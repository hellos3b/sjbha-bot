import deepmerge from 'deepmerge'
import fetch from 'node-fetch'

const baseConfig = {
    command: "chart",
    restrict: null
}

export default function (bastion, opt = {}) {
    const config = deepmerge(baseConfig, opt)

    return [{
            command: "mc_info",
            helpOnEmpty: false,
            restrict: config.restrict,
            validate(context, msg) {
                if (msg.includes(" ")) return 'Please just do the command'
            },

            async resolve(context, msg) {
                const mcURL = "https://mcapi.us/server/status?ip=51.161.122.136&port=25595";

                let response = await fetch(mcURL);
                if (response.ok) {
                    let jsonResponse = await response.json();
                    if (jsonResponse.online === false) {
                        return "The server is either offline or the bot is broken. Please dm @Devrim#9999 if the server is online."
                    } else {
                        let serverStatus = ""
                        if (jsonResponse.online === true) {
                            serverStatus = "Online"
                        } else {
                            serverStatus = "Offline"
                        }
                        const embed = {
                            "title": "SJBHA Minecraft Server",
                            "fields": [{
                                    "name": "Server IP",
                                    "value": "51.161.122.136:25595"
                                }, {
                                    "name": "Status",
                                    "value": serverStatus
                                },
                                {
                                    "name": "Message of the Day",
                                    "value": jsonResponse.motd
                                },
                                {
                                    "name": "Current Players",
                                    "value": jsonResponse.players.now
                                },
                                {
                                    "name": "Server Version",
                                    "value": jsonResponse.server.name
                                },
                            ]
                        }
                        bastion.bot.sendMessage({
                            to: context.channelID,
                            embed
                        })
                    }
                }
            },
        },
        {
            command: "mc_players",
            helpOnEmpty: false,
            restrict: [config.restrict],

            async resolve(context, msg) {


                const mcURL = "https://mcapi.us/server/status?ip=51.161.122.136&port=25595";

                let response = await fetch(mcURL);
                if (response.ok) {
                    let jsonResponse = await response.json();
                    if (jsonResponse.online === false) {
                        return "The server is either offline or the bot is broken. Please dm @Devrim#9999 if the server is online."
                    } else {
                        return "Current Players in the Server is: " + jsonResponse.players.now;
                    }
                }
            }
        },
        {
            command: "minecraft",
            helpOnEmpty: false,
            restrict: config.restrict,
            validate(context, msg) {
                if (msg.includes(" ")) return 'Please just do the command'
            },

            async resolve(context, msg) {
                const mcURL = "https://eu.mc-api.net/v3/server/ping/51.161.122.136:25595";

                let response = await fetch(mcURL);
                if (response.ok) {
                    let jsonResponse = await response.json();
                    if (jsonResponse.online === false) {
                        return "The server is either offline or the bot is broken. Please dm @Devrim#9999 if the server is online."
                    } else {
                        let serverStatus = ""
                        if (jsonResponse.online === true) {
                            serverStatus = "Online"
                        } else {
                            serverStatus = "Offline"
                        }
                        if (jsonResponse.players.online > 0) {

                            var index;
                            var playersList = 'Total: ' + jsonResponse.players.online + '\n'
                            for (index = 0; index < jsonResponse.players.sample.length; index++) { 
                                if (index == 0) {
                                    //makes it prettier, no extra newline for the first player
                                    playersList += jsonResponse.players.sample[index].name 
                                } else {
                                    playersList += '\n' + jsonResponse.players.sample[index].name 
                                }
                            }

                        } else {
                          var playersList = 'None'
                        }
                        const embed = {
                            "color": 3066993,
                            "title": "SJBHA Minecraft Server",
                            "fields": [{
                                    "name": "Server IP:Port",
                                    "value": "51.161.122.136:25595"
                                }, {
                                    "name": "Status",
                                    "value": serverStatus
                                },
                                {
                                    "name": "Message of the Day",
                                    "value": jsonResponse.description.extra[0].text
                                },
                                {
                                    "name": "Current Players",
                                    "value":  playersList
                                },
                                {
                                    "name": "Server Version",
                                    "value": jsonResponse.version.name
                                },
                            ]
                        }
                        bastion.bot.sendMessage({
                            to: context.channelID,
                            embed
                        })
                    }
                }
            },
        }
        
    ]
}
