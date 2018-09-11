import utils from './utils'

export default {

    assignGroups: function(events) {
        // Define weeks
        const THIS_WEEK = utils.weekStart(0)
        const ONE_WEEK = utils.weekStart(7)
        const TWO_WEEKS = utils.weekStart(14)
        const THREE_WEEKS = utils.weekStart(21)
        const LATER_DATE = utils.weekStart(28)

        // Assign each event a group
        return events.map( event => {
            const d = event.date_moment().toDate()
            let group = ""

            if (utils.isToday(d)) {
                group = "Today"
            } else if (utils.isInWeek(d, THIS_WEEK)) {
                group = "This Week"
            } else if (utils.isInWeek(d, ONE_WEEK)) {
                group = "Next Week"
            } else if (utils.isInWeek(d, TWO_WEEKS)) {
                group = "In Two Weeks"
            } else if (utils.isInWeek(d, THREE_WEEKS)) {
                group = "In Three Weeks"
            } else {
                group = "Later"
            }

            event._group = group
            return event
        })
    }

}