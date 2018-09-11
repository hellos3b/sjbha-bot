export default class {
    
    constructor(config, title, options) {
        this.opt = { config, title, options }
    }

    async post(bot, channelID) {
        const message = this.poll()
    
        let { id: msg_id } = await bot.sendMessage({
            to: channelID,
            message
        });

        this.msg_id = msg_id

        for (var i = 0; i < this.opt.options.length; i++) {
            await bot.addReaction({
                channelID: channelID,
                messageID: msg_id,
                reaction: this.opt.config.reactions[i]
            });
        }
    }

    async announce(bot, channelID) {
        const winners = await this.winners(bot, channelID)
        const msg = this.winnersMessage(winners)

        await bot.sendMessage({
            to: channelID,
            message: msg
        });
    }

    poll() {
        const config = this.opt.config
        const options = this.opt.options

        let message = "```"
        message += "POLL: " + this.opt.title + "\n\n";
        for (var i = 0; i < options.length; i++) {
            message += config.reactionsText[i] + " - " + options[i] + "\n";
        }
        message += "```";
        return message;
    }

    async winners(bot, channelID) {
        const options = this.opt.options;
        let results = [];
        let winningVotes = 0;
        let winners = [];

        for (var i = 0; i < options.length; i++) {
            let r = await bot.getReaction({
                channelID: channelID,
                messageID: this.msg_id,
                reaction: this.opt.config.reactions[i]
            });

            r = r.filter( m => !m.bot );

            let result = { title: options[i], votes: r.length };

            if (result.votes > winningVotes) {
                winners = [result];
                winningVotes = result.votes;
            } else if (result.votes === winningVotes) {
                winners.push(result);
            }

            results.push(r);
        }   
        
        return winners
    }

    winnersMessage(winners) {
        let message = "";
        if (winners.length === 1) {
            message = `The poll has ended!\n`
                +"```" + `${this.opt.title}\nAnswer: ${winners[0].title} (With ${winners[0].votes} votes)` + "```";
        } else if (winners.length > 1) {
            message = `The poll has ended!\n`
                +"```" + `${this.opt.title}\n`;

            message += `${winners.length} way tie with ${winners[0].votes} votes! Answers:\n`;

            for (var i = 0; i < winners.length; i++) {
                message += winners[i].title + "\n";
            }

            message += "```";
        }
        return message
    }
}