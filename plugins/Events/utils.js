import chalk from 'chalk'
import moment from 'moment'
import 'moment-timezone'

export default {

    toParam(obj) {
        return `?` + Object.entries(obj).map( ([key, value]) => key + '=' + encodeURI(value) ).join("&");
    },
    
    flatISO(dateStr) {
        return dateStr.replace(/-/g, "")
            .replace(/:/g, "")
            .replace(".000", "")
    },
    
    GCALLink(event) {
        let d = new Date(event.timestamp)
        let post = new Date(event.timestamp)
        post.setHours( post.getHours() + 1)
    
        const baseUrl = `https://www.google.com/calendar/render`
        const params = {
            action: "TEMPLATE",
            text: event.info,
            dates: `${this.flatISO(d.toISOString())}/${this.flatISO(post.toISOString())}`,
            details: event.options.description.slice(0, 1000),
            location: event.location,
            sprop:"name"
        }
    
        return baseUrl + this.toParam(params)
    },

    // Converts event string "option: value | option2: value" to jsobj { option: value, option2: value}
    getOptions(opt) {
        const possibleOptions = new Set(["date", "name", "url", "type", "description", "location", "image"]);

        return opt.reduce( (res, o) => {
            let [key, ...value] = o.split(":").map(s => s.trim())
            key = key.toLowerCase()
            key = (key === "info") ? "name" : key
            value = value.join(":")
            if (!possibleOptions.has(key)) {
                console.log("   ", chalk.blue(`[Events]`), chalk.gray(`Option '${key}' not a valid Event option`))
            } else {
                res[key] = value
            }
            return res
        }, {})
    },

    // this is used for figuring out meetup groups (day, week, etc)
    eventSort(a, b) {
        return a.date_moment().isAfter(b.date_moment()) ? 1 : -1 
    },

    weekStart(offset) {
        if (typeof offset === 'number') {
            return new moment().tz("America/Los_Angeles")
                .add(offset, 'days')
                .startOf("week")
        } else {
            return offset.startOf("week")
        }
    },

    dayFormat(d) {
        return `${d.month()}-${d.date()}`
    },

    isSameDayAndMonth(d1, d2) {
        return this.dayFormat(d1) === this.dayFormat(d2)
    },

    isToday(d) {
        const today = new moment().tz("America/Los_Angeles")
        return this.isSameDayAndMonth(d, today)
    },

    isInWeek(d, week) {
        let start = this.weekStart(d)
        return this.dayFormat(start) === this.dayFormat(week)
    }
}