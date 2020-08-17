/*
    These are the stupid simple echo commands for the server
*/

export default function(bastion, config={}) {

    return [

        {
            command: "help",
            resolve: "Command has been moved to `!meetup` or `!meetup help`"
        },

        {
            command: "scooter",
            resolve: "<:coolscooter:443185468348170240><:coolscooter:443185468348170240>😎😎SCOOTER GANG SCOOTER GANG SCOOTER GANG😎😎<:coolscooter:443185468348170240><:coolscooter:443185468348170240>"
        },

        {
            command: "scooters",
            resolve: "<:coolscooter:443185468348170240><:coolscooter:443185468348170240>😎😎SCOOTER GANG SCOOTER GANG SCOOTER GANG😎😎<:coolscooter:443185468348170240><:coolscooter:443185468348170240>"
        },

        {
            command: "swirls",
            resolve: "<:swirls:430968917540995072><:swirls:430968917540995072><:swirls:430968917540995072><:swirls:430968917540995072>\:laughing:\:rofl:  DID SOMEBODY SAY SWIRLS?! \:rofl:\:laughing:<:swirls:430968917540995072><:swirls:430968917540995072><:swirls:430968917540995072><:swirls:430968917540995072>"
        },

        {
            command: "mention",
            resolve: "Commands been changed to `!meetup mention`"
        },

        {
            command: "mocha",
            resolve: "\:coffee:\:coffee: TIME FOR A MOCHA BREAK \:no_entry_sign:\:sleeping:"
        },

        {
            command: "boba",
            resolve: "\:black_circle: \:honey_pot: \:drops_milk:  \:black_circle: \:black_circle: BOBA TIME \:black_circle: \:black_circle: \:drops_milk: \:honey_pot: \:black_circle:"
        },

        {
            command: "help",
            resolve: "Commands been changed to `!meetup` or `!meetup help`"
        },

        {
            command: "cancel",
            resolve: "Commands been changed to `!meetup cancel`"
        },

        {
            command: "resist",
            resolve: "Commands been changed to `!team resist`"
        },

        {
            command: "edit",
            resolve: "Commands been changed to `!meetup edit`"
        },

        {
            command: "wheres",
            options: bastion.parsers.args(["name"]),
            resolve(context, name) {
                if (name.toLowerCase() === "james") return "<@!115794072735580162>!"
            }
        },

        {
            command: "echo",
            restrict: ["admin"],
            options: bastion.parsers.split,
            resolve(context, [channelMention, ...msg]) {
                const channelID = channelMention.replace("<#", "").replace(">","")
                bastion.bot.simulateTyping(channelID)
                this.send(channelID, msg.join(" "))
            }
        },

        {
            command: "git",
            resolve: "Github: https://github.com/hellos3b/sjbha-bot"
        },

        {
            command: "github",
            resolve: "Github: https://github.com/hellos3b/sjbha-bot"
        },

        {
            command: "bug",
            resolve: "Submit the bug here so I can keep track of them: https://github.com/hellos3b/sjbha-bot/issues/new"
        }

        // {
        //     command: "test",
        //     resolve(context) {
        //         console.log('channels', bastion.bot.channels[context.channelID].name)
        //     }
        // }

    ]
}
