import utils from './utils'

const SQUARES = 30; // default squares in XP bar
const LEVEL_EXP = 10800; // how much xp to level up
const MIN_RUNS = 5; // amount of runs in average to get bonuses
const BONUS_AMT = 0.2;

export default {

    LEVEL_EXP, MIN_RUNS, BONUS_AMT,

    XPBar(exp, squares) {
        squares = squares || SQUARES;
        const percent = exp / LEVEL_EXP;
        const x_fill = Math.ceil( squares*percent );
        const x_empty = squares - x_fill;
        const chart_fill = new Array(x_fill + 1).join( "■" );
        const chart_empty = new Array(x_empty + 1).join( " " );

        return `[${chart_fill}${chart_empty}]`;
    },

    calculate(activity, averages, user) {
        let xp = activity.moving_time
        let stats = utils.getActivityStats(activity)

        let bonuses = []
        if (averages.total >= MIN_RUNS) {
            const distDiff = stats.distance - averages.distance
            const paceDiff = averages.pace_seconds - stats.pace_seconds
            
            if (distDiff > 0) {
                let perc = Math.floor(distDiff / averages.distance * 1000)/10
                const dist = Math.floor(distDiff*100) / 100
                bonuses.push(`+${dist}mi`)
            }

            if (paceDiff > 0) {
                let perc = Math.floor(paceDiff / averages.pace_seconds * 1000)/10
                bonuses.push(`+${perc}% spd`)
            }

            xp += BONUS_AMT*bonuses.length
        }
        xp = Math.floor(xp)

        user.EXP += xp
        let lvldUp = false
        if (user.EXP >= LEVEL_EXP) {
            user.level += 1
            user.EXP = user.EXP - StravaLevels.LEVEL_EXP
            lvldUp = true
        }

        return {
            user,
            xp,
            bonuses,
            lvldUp
        }
    }

}