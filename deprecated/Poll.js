import chrono from 'chrono-node'
import moment from 'moment'

import logger from 'winston'

const letters = ["🇦", "🇧", "🇨", "🇩"];
const letterAlphabet = ["A", "B", "C", "D"];

// 10 minutes
let TIME_LIMIT = 10 * 60 * 1000;

export default async function({ 
    bot,
    channelID,
    title,
    options=[]
}) {

    logger.info("Starting new poll", title);

    let message = "```POLL: " + title + "\n\n";
    for (var i = 0; i < options.length; i++) {
        message += letterAlphabet[i] + " - " + options[i] + "\n";
    }
    message += "```";

    let { id: msg_id } = await bot.sendMessage({
        to: channelID,
        message
    });

    for (var i = 0; i < options.length; i++) {
        await bot.addReaction({
            channelID: channelID,
            messageID: msg_id,
            reaction: letters[i]
        });
    }

    async function finish() {
        let results = [];
        let winningVotes = 0;
        let winners = [];

        for (var i = 0; i < options.length; i++) {
            let r = await bot.getReaction({
                channelID: channelID,
                messageID: msg_id,
                reaction: letters[i]
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

        announce(winners, results);
    }

    async function announce(winners) {
        console.log("Messages", winners);
        let message = "";
        if (winners.length === 1) {
            message = `The poll has ended!\n`
                +"```" + `${title}\nAnswer: ${winners[0].title} (With ${winners[0].votes} votes)` + "```";
        } else if (winners.length > 1) {
            message = `The poll has ended!\n`
                +"```" + `${title}\n`;

            message += `${winners.length} way tie with ${winners[0].votes} votes! Answers:\n`;

            for (var i = 0; i < winners.length; i++) {
                message += winners[i].title + "\n";
            }

            message += "```";
        }

        await bot.sendMessage({
            to: channelID,
            message
        });
    }

    setTimeout(() => finish(), TIME_LIMIT);
}