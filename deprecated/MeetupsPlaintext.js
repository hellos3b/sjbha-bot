import Meetup from './Meetup'
import MeetupsDB from './MeetupsDB'
import channels from './channels'
import moment from 'moment'

const MESSAGE_ID = "464562534159089664";
const TODAY_ID = "471806505365143552";
const THIS_WEEK_ID = "471806506321575936";
const NEXT_WEEK_ID = "471806507093065749";
const TWO_WEEKS_ID = "471806508041109504";
const THREE_WEEKS_ID = "471806508913655828";
const LATER_ID = "471806527603212298";

const TITLE_DATE_FORMAT = "MMMM Do";

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

        const Group = function(msg_id, title, date, isWeek) {
            this.meetups = [];

            this.add = function(meetup) {
                this.meetups.push(meetup)
            }

            this.getTitle = function() {
                let start = new moment(date).format(TITLE_DATE_FORMAT)

                if (!isWeek) {
                    return `${title} (${start})`
                } else {
                    if (date < new Date()) {
                        start = new Date()
                        start.setDate(start.getDate() + 1)
                        start = new moment(start).format(TITLE_DATE_FORMAT)
                    }
                    let end = new Date(date.getTime())
                    end.setDate( end.getDate() + 6)
                    end = new moment(end).format(TITLE_DATE_FORMAT)
                    return `${title} (${start} - ${end})`
                }
            }

            this.getMsgId = function() {
                return msg_id;
            }
        }

        var REFERENCE = moment(); // fixed just for testing, use moment();
        var TODAY = REFERENCE.clone().startOf('day');
        var TOMORROW = REFERENCE.clone().add(1, 'days').startOf('day');
        var A_WEEK = REFERENCE.clone().add(8, 'days').startOf('day');

        const THIS_WEEK = weekStart(0)
        const ONE_WEEK = weekStart(7)
        const TWO_WEEKS = weekStart(14)
        const THREE_WEEKS = weekStart(21)
        const LATER_DATE = weekStart(28)
        
        let groups = {
            "Today": new Group(TODAY_ID, `Today`, TODAY.toDate(), false),
            "This Week": new Group(THIS_WEEK_ID, `Later This Week`, THIS_WEEK, true),
            "Next Week": new Group(NEXT_WEEK_ID, `Next Week`, ONE_WEEK, true),
            "In Two Weeks": new Group(TWO_WEEKS_ID, `In Two Weeks`, TWO_WEEKS, true),
            "In Three Weeks": new Group(THREE_WEEKS_ID, `In Three Weeks`, THREE_WEEKS, true),
            "Later": new Group(LATER_ID, `Later`, LATER_DATE, false)
        };

        function weekStart(offset) {
            if (typeof offset === 'number') {
                let d = new Date()
                d.setDate( d.getDate() + offset - d.getDay() )
                return d
            } else {
                let d = new Date(offset.getTime())
                d.setDate( d.getDate() - d.getDay() )
                return d
            }
        }

        function dayFormat(d) {
            return `${d.getMonth()}-${d.getDate()}`
        }

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
        function checkWeek(momentDate, week) {
            let d = new Date(momentDate.toDate())
            let start = weekStart(d)
            console.log(`check week d: ${d}, start: ${start}, week: ${week}`)

            return dayFormat(start) === dayFormat(week)
        }

        // group into times
        for (var i = 0; i < meetups.length; i++) {
            let m = meetups[i].date_moment();
            if (isToday(m)) {
                groups["Today"].add(meetups[i])
            } else if (checkWeek(m, THIS_WEEK)) {
                console.log("Is Within a week!");
                groups["This Week"].add(meetups[i]);
            } else if (checkWeek(m, ONE_WEEK)) {
                groups["Next Week"].add(meetups[i]);
            } else if (checkWeek(m, TWO_WEEKS)) {
                groups["In Two Weeks"].add(meetups[i]);
            } else if (checkWeek(m, THREE_WEEKS)) {
                groups["In Three Weeks"].add(meetups[i]);
            } else {
                groups["Later"].add(meetups[i]);
            }
        }

        for (var k in groups) {
            let group = groups[k];
            let meetups = group.meetups;
            let fields = [];
            let message = '';//`\`\`\`md\n< ${k} >\`\`\``;

            let embed = {
                "author": {
                    "name": group.getTitle(),
                    "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
                }
            }

            if (meetups.length > 0) {
                for (var i = 0; i < meetups.length; i++) {
                    let m = meetups[i];
                    let reactions = await m.getReactions(bot);
                    let url = `https://discordapp.com/channels/358442034790400000/430878436027006978/${m.info_id()}`;
                    let title = m.info_str();
                    let fromNow = m.date_moment().fromNow();
                    let date = m.date_moment().format("ddd, MMMM D @ h:mma");
                    let str = `**${title}**\n\`${date} (${fromNow}) (y: ${reactions.yes.length},m: ${reactions.maybe.length})\`\n<${url}>\n`;
                    // fields.push(str);
                    fields.push({
                        name: `${title} | ${date} (${fromNow})`,
                        // value: `${date} (${fromNow}) (y: ${reactions.yes.length},m: ${reactions.maybe.length})\n<${url}>\n`
                        value: `<${url}>`
                    })
                }
                embed.fields = fields;
                // message += fields.join("\n");
            } else {
                embed.description = `*No meetups scheduled for ${k}*`;
                // message += `*No meetups scheduled for ${k}*`;
            }

            await bot.editMessage({
                channelID: channels.MEETUPS_PLAINTEXT,
                messageID: group.getMsgId(),
                embed
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