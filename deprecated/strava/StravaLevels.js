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
    }

}