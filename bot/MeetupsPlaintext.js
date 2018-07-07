import Meetup from './Meetup'
import MeetupsDB from './MeetupsDB'
import channels from './channels'
import moment from 'moment'

const MESSAGE_ID = "464562534159089664";
const TODAY_ID = "464571332068245526";
const TOMORROW_ID = "464571333557092362";
const WEEK_ID = "464571334115065857";
const OVER_WEEK_ID = "464571335151058944";

export default {

    update: async function({bot}) {
        let meetups = await MeetupsDB.getMeetups();
        meetups = meetups.map( m => new Meetup(m))
            .sort( (a, b) => {
                if (a.date_moment().toISOString() < b.date_moment().toISOString())
                    return -1;
                if (a.date_moment().toISOString() > b.date_moment().toISOString())
                    return 1;
                return 0;
            });

        let groups = {
            "Today": [],
            "Tomorrow": [],
            "This Week": [],
            "Over A Week": []
        };

        var REFERENCE = moment(); // fixed just for testing, use moment();
        var TODAY = REFERENCE.clone().startOf('day');
        var TOMORROW = REFERENCE.clone().add(1, 'days').startOf('day');
        var A_WEEK = REFERENCE.clone().add(8, 'days').startOf('day');

        function isSameDayAndMonth(m1, m2){
            return m1.date() === m2.date() && m1.month() === m2.month()
        }

        function isToday(momentDate) {
            return isSameDayAndMonth(momentDate, TODAY);
        }
        function isTomorrow(momentDate) {
            return isSameDayAndMonth(momentDate, TOMORROW);
        }
        function isWithinAWeek(momentDate) {
            return momentDate.isBefore(A_WEEK);
        }
        // group into times
        for (var i = 0; i < meetups.length; i++) {
            let m = meetups[i].date_moment();
            if (isToday(m)) {
                console.log("Is today!");
                groups["Today"].push(meetups[i]);
            } else if (isTomorrow(m)) {
                console.log("Is tomorrow!");
                groups["Tomorrow"].push(meetups[i]);
            } else if (isWithinAWeek(m)) {
                console.log("Is Within a week!");
                groups["This Week"].push(meetups[i]);
            } else {
                groups["Over A Week"].push(meetups[i]);
            }
        }

        let msg_ids = {
            "Today": TODAY_ID,
            "Tomorrow": TOMORROW_ID,
            "This Week": WEEK_ID,
            "Over A Week": OVER_WEEK_ID
        };

        for (var k in groups) {
            let g = groups[k];
            let fields = [];
            let message = `\`\`\`md\n< ${k} >\`\`\``;

            if (g.length > 0) {
                for (var i = 0; i < g.length; i++) {
                    let m = g[i];
                    let reactions = await m.getReactions(bot);
                    let url = `https://discordapp.com/channels/358442034790400000/430878436027006978/${m.info_id()}`;
                    let title = m.info_str();
                    let fromNow = m.date_moment().fromNow();
                    let date = m.date_moment().format("MMMM D @ h:mma");
                    let str = `\`\`\`py\n@ ${title}\n# ${fromNow} - ${date}\n(Y: ${reactions.yes.length})(M: ${reactions.maybe.length})\`\`\`<${url}>\n`;
                    fields.push(str);
                }

                message += fields.join("\n");
            } else {
                message += `*No meetups scheduled for ${k}*`;
            }

            let id = msg_ids[k];
            await bot.editMessage({
                channelID: channels.MEETUPS_PLAINTEXT,
                messageID: id,
                message
            })
        }
        // let msg = fields.join("\n");
        // // let message = `Welcome to Meetups Plain text, a simplified list of meetups in chronological order.\nClick on the link to be taken to the RSVP announcement\nThis channel is updated once an hour`;

        // console.log("MESAGE LENGTH", message.length);

        // await bot.editMessage({
        //     channelID: channels.MEETUPS_PLAINTEXT,
        //     messageID: MESSAGE_ID,
        //     message
        // });
    }

}