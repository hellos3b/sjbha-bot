import StatsModel from '../db/models/StatsModel'
import moment from 'moment'
import { Stats } from 'fs';

let stats = {};
export default {

    getTime() {
        let m = moment()
        m.set({
            'hours': m.get('hours'),
            'minutes': 0,
            'seconds': 0,
            'millisecond': 0
        });
        return m;
    },

    start() {
        let time = this.getTime();
        stats = {
            count: 0,
            timestamp: time
        };
    },

    getStats() {
        return stats;
    },

    getHistory(limit) {
        return new Promise((resolve, reject) => {
            StatsModel.find()
                .sort({timestamp: -1})
                .limit(limit).exec( (err, models) => {
                resolve(models)
            });
        })
    },

    getDailyHistory() {
        return new Promise((resolve, reject) => {
            let startDate = new Date()
            startDate.setDate( startDate.getDate() - 14 );
            startDate.setHours(0);
            startDate.setMinutes(0);

            console.log('start date', startDate);
            let aggregate = [
                { $match: {
                    timestamp: { $gte: startDate }
                }},
                { $project: {
                    timestamp: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'America/Los_Angeles' } },
                    count: true
                }},
                { $group: {
                    _id: '$timestamp',
                    count: {
                        $sum: '$count'
                    }
                }}
            ]
            StatsModel.aggregate(aggregate)
                .exec( (err, models) => {
                    models = models.map (n => {
                        n.timestamp = n._id;
                        return n;
                    });
                    console.log(models);
                    resolve(models)
                });
        })
    },

    getAverageHistory() {
        return new Promise((resolve, reject) => {
            let aggregate = [
                { $project: {
                    timestamp: { $dateToString: { format: '%Y-%m-%dT%H:%M', date: '$timestamp', timezone: 'America/Los_Angeles' } },
                    hour: { $dateToString: { format: '%H', date: '$timestamp', timezone: 'America/Los_Angeles' } },
                    count: true
                }},
                { $group: {
                    _id: '$hour',
                    timestamp: {
                        $first: '$timestamp'
                    },
                    count: {
                        $avg: '$count'
                    }
                }}
            ]
            StatsModel.aggregate(aggregate)
                .exec( (err, models) => {
                    console.log(err);
                    models = models.sort( (a, b) => {
                        let ad = new Date(a.timestamp);
                        let bd = new Date(b.timestamp);
                        console.log(a.timestamp);
                        return ad.getHours() > bd.getHours() ? 1 : -1
                    })
                    console.log(models);
                    resolve(models)
                });
        })
    },

    compareTime(a, b) {
        return a.format("MM/DD/YY hh:mm") === b.format("MM/DD/YY hh:mm")
    },

    increment() {
        if (this.compareTime(this.getTime(), stats.timestamp)) {
            stats.count++;
        } else {
            this.save()
            this.start()
            stats.count++;
        }
    },

    save() {
        console.log("Saving stats", stats);
        let count = stats.count;
        let timestamp = stats.timestamp;
        StatsModel.findOne({ timestamp: timestamp.toISOString() }, (err, doc) => {
            let stat = null;
            if (doc) {
                stat = doc;
                stat.count += count;
                console.log("document exists", stat);
            } else {
                stat = new StatsModel({
                    count: count,
                    timestamp: timestamp.toISOString()
                });
                console.log("new statsModel:", stat);
            }
        
            stat.save((saveErr, savedStat) => {
                if (saveErr) throw saveErr;
                console.log("saved stat", savedStat);
            });
        });
    }

}