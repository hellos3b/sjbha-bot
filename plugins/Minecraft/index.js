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
            restrictMessage: "",
            options: "",
            validate(context, msg) {
                if (msg.includes(" ")) return 'Please just do the command'
            },

            async resolve(context, msg) {
                const mcURL = "https://mcapi.us/server/status?ip=51.161.122.136&port=25595";

                let response = await fetch(mcURL);
                if (response.ok) {
                    let jsonResponse = await response.json();
                    if (jsonResponse.online === false) {
                        return "The server is either offline or the bot is broken. Please dm @Devrim#1557 if the server is online."
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
            // restrict: [bastion.channels.gaming],
            restrictMessage: "",
            options: "",

            async resolve(context, msg) {


                const mcURL = "https://mcapi.us/server/status?ip=51.161.122.136&port=25595";

                let response = await fetch(mcURL);
                if (response.ok) {
                    let jsonResponse = await response.json();
                    if (jsonResponse.online === false) {
                        return "The server is either offline or the bot is broken. Please dm @Devrim#1557 if the server is online."
                    } else {
                        return "Current Players in the Server is: " + jsonResponse.players.now;
                    }
                }
            }
        }
    ]
}