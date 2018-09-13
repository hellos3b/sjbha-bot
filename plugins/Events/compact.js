import moment from 'moment'
import grouping from './grouping'
import utils from './utils'

const Group = function(msg_id, title, date, isWeek) {
    const dateFormat = "MMMM Do"

    this.events = [];

    this.add = function(meetup) {
        this.events.push(meetup)
    }

    this.getTitle = function() {
        let start = new moment(date).format(dateFormat)

        if (!isWeek) {
            // If not week, just show the date the group points to
            return `${title} (${start})`
        } else {
            // If is week, find the (date -> date).
            // If date is before /today/, make the date today + 1
            if (date < new Date()) {
                start = new Date()
                start.setDate(start.getDate() + 1)
                start = new moment(start).format(dateFormat)
            }
            let end = new Date(date.getTime())
            end.setDate( end.getDate() + 6)
            end = new moment(end).format(dateFormat)
            return `${title} (${start} - ${end})`
        }
    }

    this.getFields = function() {
        return this.events
            .sort((a,b) => a.date_moment().isAfter(b.date_moment())? 1 : -1)
            .map(this.getEventField)
    }

    this.getEventField = function(event) {
        const url = `https://discordapp.com/channels/358442034790400000/430878436027006978/${event.info_id()}`;
        const title = event.info_str();
        const fromNow = event.date_moment().fromNow();
        const date = event.date_moment().format("ddd, MMMM D @ h:mma");

        return {
            name: `${title} | ${date} (${fromNow})`,
            value: `<${url}>`
        }   
    }

    this.hasEvents = function() {
        return this.events.length
    }

    this.getMsgId = function() {
        return msg_id;
    }
}

export default {

    update: async function(bastion, config, eventsList) {
        const log = bastion.Logger("Compact").log

        log("Updating compact list")
        let groups = {
            "Today": new Group(config.compact.todayId, `Today`, new Date(), false),
            "This Week": new Group(config.compact.thisWeekId, `Later This Week`, utils.weekStart(0), true),
            "Next Week": new Group(config.compact.nextWeekId, `Next Week`, utils.weekStart(7), true),
            "In Two Weeks": new Group(config.compact.twoWeeksId, `In Two Weeks`, utils.weekStart(14), true),
            "In Three Weeks": new Group(config.compact.threeWeeksId, `In Three Weeks`, utils.weekStart(21), true),
            "Later": new Group(config.compact.laterId, `Later`, utils.weekStart(28), false)
        }

        const events = grouping.assignGroups(eventsList)
        events.forEach( ev => groups[ev._group].add(ev))

        log("Updating groups:")
        for (var k in groups) {
            let group = groups[k]

            let embed = {
                "author": {
                    "name": group.getTitle(),
                    "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
                }
            }

            if (group.hasEvents) {
                embed.fields = group.getFields()
            } else {
                embed.description = `*No meetups scheduled for ${k}*`;
            }

            await bastion.bot.editMessage({
                channelID: config.compactChannel,
                messageID: group.getMsgId(),
                embed
            })
            log("Updated group", k)
        }
    }

}