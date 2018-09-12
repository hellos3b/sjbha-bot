import Table from 'ascii-table'

export default {
    getMiles(i) {
        let n = i*0.000621371192;
        return Math.round( n * 100 ) / 100;
    },

    pad(num) {
        return ("0"+num).slice(-2);
    },

    dateString(date) {
        return date.getMonth() + "-" + date.getDate();
    },

    hhmmss(secs, leadingZero) {
        var minutes = Math.floor(secs / 60);
        secs = Math.floor(secs%60);
        var hours = Math.floor(minutes/60)
        minutes = minutes%60;
        let result = "";
        if (hours > 0) {
            result += hours+":";
        }
        if (leadingZero) {
            minutes = this.pad(minutes)
        }
        result += `${minutes}:${this.pad(secs)}`;
        return result;
    },

    objToParams(obj) {
        return Object.keys(obj)
            .map(key => key + '=' + encodeURIComponent(obj[key]))
            .join('&')
    },

    runTotalAverages(run_totals) {
        const dist_total = this.getMiles(run_totals.distance);
        const pace_total = run_totals.moving_time / dist_total;
        const moving_avg = run_totals.moving_time / run_totals.count

        let dist_avg = dist_total / run_totals.count;
        dist_avg = Math.floor(dist_avg * 100) / 100;

        return {
            total: run_totals.count,
            distance: dist_avg,
            pace: this.hhmmss(pace_total),
            pace_seconds: pace_total,
            time: moving_avg,
            moving_time: run_totals.moving_time
        };        
    },

    runTotals(run_totals) {
        const dist_total = this.getMiles(run_totals.distance);
        const pace_total = (dist_total) ? run_totals.moving_time / dist_total : 0
        const moving_time = run_totals.moving_time

        return {
            total: run_totals.count,
            time: moving_time,
            timeStr: this.hhmmss(moving_time, true),
            distance: dist_total,
            pace: pace_total,
            paceStr: this.hhmmss(pace_total, true)
        }
    },

    getActivityStats(activity, padded=false) {
        const distance = this.getMiles(activity.distance)
        const pace_seconds = Math.round(activity.moving_time / distance)
        const pace = !distance ? "0:00" : this.hhmmss( pace_seconds, padded )
        const time = this.hhmmss( activity.moving_time, padded )

        return { moving_time: activity.moving_time, distance, pace, time, pace_seconds }
    },

    calendar(user, activities, start_date) {
        // Convert into a hashmap of datestring
        const dates = activities.map(n => {
            let date = new Date(n.start_date)
            return this.dateString(date)
        }).reduce( (res, obj) => {
            res[obj] = true
            return res
        }, {})

        let cal = `S  M  T  W  T  F  S`;
        const tomorrow = new Date();
        const today = this.dateString(new Date());
        tomorrow.setDate(tomorrow.getDate() + 1);
        const t = this.dateString(tomorrow);
        let c = this.dateString(start_date);

        while (c != t) {
            if (start_date.getDay() === 0) {
                cal += "\n";
            }
            if (dates[c]) {
                cal += "X  ";
            } else {
                if (c === today) {
                    cal += "o  ";
                } else {
                    cal += "-  ";
                }
            }
            start_date.setDate(start_date.getDate() + 1);
            c = this.dateString(start_date);
        }

        return cal
    },

    getChallengeTargetStr(targets) {
        if (targets.pace_seconds) {
            return `${this.hhmmss( targets.pace_seconds, true )}/mi for ${targets.distance}mi`
        }
        if (targets.time) {
            return `${this.hhmmss( targets.time )} time`
        }
        if (targets.distance) {
            return `${targets.distance}mi`
        }
    },

    challengeTable(challengers) {
        // hacky way of getting the challenge name
        const challengeName = challengers[0].challenge.challenge.name
        var table = new Table(`< Weekly Challenge: ${challengeName} >`);
        table.removeBorder();
        // table.setHeading('User', 'Goal', '')
        table.setHeadingAlignLeft(Table.LEFT)

        challengers.forEach( (entry) => {
            const finished = entry.challenge.finished ? `👏` : ''
            table.addRow(
                `<${entry.user}>`, 
                this.getChallengeTargetStr(entry.challenge.targets),
                finished
            )
        })

        return table.toString()
    }
}