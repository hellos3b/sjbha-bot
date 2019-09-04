import cron from 'node-cron'

export default {
    // init default schedules
    init(bastion) {
        // every week sunday at 12:01am
        cron.schedule('1 0 * * 1', () => {
            bastion.emit("schedule-weekly")
        }, {
            timezone: "America/Los_Angeles"
        })

        // every hour
        cron.schedule('0 * * * *', () => {
            bastion.emit("schedule-hourly")
        }, {
            timezone: "America/Los_Angeles"
        })

        // every day 12:01am
        cron.schedule('1 0 * * *', () => {
            bastion.emit("schedule-daily")
        }, {
            timezone: "America/Los_Angeles"
        })

        // every two hours
        cron.schedule('0 */2 * * *', () => {
            bastion.emit("schedule-bihourly")
        }, {
            timezone: "America/Los_Angeles"
        })
    },

    schedule(str, callback, options={}) {
        cron.schedule(str, callback, options)
    }
}