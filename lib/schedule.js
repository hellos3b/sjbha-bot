import cron from 'node-cron'

export default {
    // init default schedules
    init(bastion) {
        // every week sunday at 12:01am
        cron.schedule('1 0 * * 1', () => {
            bastion.emit("schedule-weekly")
        })

        // every hour
        cron.schedule('0 * * * *', () => {
            bastion.emit("schedule-hourly")
        })

        // every day 12:01am
        cron.schedule('1 0 * * *', () => {
            bastion.emit("schedule-daily")
        })

        // every two hours
        cron.schedule('0 */2 * * *', () => {
            bastion.emit("schedule-bihourly")
        })
    },

    schedule(str, callback) {
        cron.schedule(str, callback)
    }
}