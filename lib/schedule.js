import cron from 'node-cron'

export default {
    // init default schedules
    init(bastion) {
        // every week sunday at 12:01am
        cron.schedule('1 0 * * 1', () => {
            bastion.emit("schedule-weekly")
        }, {
            timezone: "America/Chicago"
        })

        // every hour
        cron.schedule('0 * * * *', () => {
            bastion.emit("schedule-hourly")
        }, {
            timezone: "America/Chicago"
        })

        // every day 12:01am
        cron.schedule('1 0 * * *', () => {
            bastion.emit("schedule-daily")
        }, {
            timezone: "America/Chicago"
        })

        // every two hours
        cron.schedule('0 */2 * * *', () => {
            bastion.emit("schedule-bihourly")
        }, {
            timezone: "America/Chicago"
        })
    },

    schedule(str, callback, options={}) {
        cron.schedule(str, callback, options)
    }
}