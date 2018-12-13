import utils from './utils'
import challenges from './challenges'

const SQUARES = 30; // default squares in XP bar
const LEVEL_EXP = 10800; // how much xp to level up
const MIN_RUNS = 5; // amount of runs in average to get bonuses
const BONUS_AMT = 0.2;
const BASE_EXP = 2000;
const CHALLENGE_BONUS = 1200

export default {

    CHALLENGE_BONUS, LEVEL_EXP, MIN_RUNS, BONUS_AMT,

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
        const stats = utils.getActivityStats(activity)
        let xp = (averages.total >= MIN_RUNS) ?
            BASE_EXP * (stats.distance / averages.distance) 
            : 1000

        const challengeDone = challenges.test(stats, user)
        if (challengeDone) {
            xp += CHALLENGE_BONUS
        }

        let bonuses = []
        if (averages.total >= MIN_RUNS) {
            const distDiff = stats.distance - averages.distance

            if (distDiff > 0) {
                const dist = Math.floor(distDiff*100) / 100
                bonuses.push(`+${dist}mi`)
            }
        }

        xp = Math.floor(xp)

        user.EXP += xp
        let lvldUp = false
        if (user.EXP >= LEVEL_EXP) {
            user.level += 1
            user.EXP = user.EXP - LEVEL_EXP
            lvldUp = true
        }

        return {
            user,
            xp,
            bonuses,
            lvldUp,
            challengeDone
        }
    }

}