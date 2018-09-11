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
            command: "teams",
            resolve: "Commands been changed to `!team list`"
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
        }

    ]
}