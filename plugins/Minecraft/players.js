const fetch = require('node-fetch');

export default function (bastion, opt = {}) {
    // const cmd = bastion.command("tldr")
    // const help = `${cmd} (description)`
    return [{
        command: 'mc_players',
        helpOnEmpty: false,
        // restrict: [bastion.channels.gaming],
        restrictMessage: "",
        options: "",
        validate(context, msg) {
            if (msg.contains(" ")) return 'Please just do the command'
        },

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
    }]
}
