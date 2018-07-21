import StatsModel from '../db/models/StatsModel'
import moment from 'moment'
import { Stats } from 'fs';

let stats = {};
export default {

    getTime() {
        let m = moment()
        m.set({


        })
        return m;
    },

    start() {
        let time = this.getTime();
        stats = {
            count: 0,
            timestamp: time
        };
    },

    compareTime(a, b) {
        return a.format("MM/DD/YY hh:mm") === B.format("MM/DD/YY hh:mm")
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
        StatsModel.findOne({ timestamp: stats.timestamp.toISOString() }, (err, doc) => {
            let stat = null;
            if (doc) {
                stat = doc;
                stat.count += stats.count;
            } else {
                stat = new StatsModel(stats);
            }
        
            stat.save((saveErr, savedStat) => {
                if (saveErr) throw saveErr;
                console.log(savedStat);
            });
        });
    }

}