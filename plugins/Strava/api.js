import Axios from 'axios'
import chalk from 'chalk'
import levels from './levels'
import utils from './utils'

const logPrefix = `    ` + chalk.blue("[Strava]")

export default bastion =>{
    const $ = new bastion.Queries('stravaID')

    return {
        // Creates the header JSON for Axios
        authHeader(token) {
            return { 
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        },

        // Get user info from mongo
        getUserInfo: async function(obj) {
            console.log(logPrefix, chalk.gray("getAthlete -> "), obj)
            const user = await $.findOne(obj)
            if (!user.accessToken) return null
            return user
        },

        getAthleteStats: async function(owner_id, accessToken) {
            console.log(logPrefix, chalk.gray("getAthleteStats -> ", owner_id))
            const url = `https://www.strava.com/api/v3/athletes/${owner_id}/stats`
            return Axios.get(url, this.authHeader(accessToken)).then(r => r.data)
        },

        getAthleteActivities(owner_id, access_token, start_date) {
            const epoch = start_date.getTime() / 1000
            const url = `https://www.strava.com/api/v3/athlete/activities?after=${epoch}&page=1`
        
            return Axios.get(url, this.authHeader(access_token)).then( res => res.data )
        },    

        getStats: async function(userID) {
            console.log(logPrefix, chalk.gray("getStats -> ", userID))
            const user = await this.getUserInfo({userID})
            if (!user) return null

            const stats = await this.getAthleteStats(user.stravaID, user.accessToken, user.user)
            stats.username = user.user
            stats.level = user.level
            stats.xp = user.EXP

            return stats      
        },

        getBatchStats: async function(users) {
            console.log(logPrefix, chalk.gray("getBatchStats -> "), users.length)
            const promises = users.map( n => {
                return this.getAthleteStats(n.stravaID, n.accessToken, n.user)
                    .then( json => {
                        json.user = n.user
                        return json
                    })
            })
            return Promise.all(promises)
        },

        getActivity(activity_id, accessToken) {
            console.log(logPrefix, chalk.gray("getActivity -> "), activity_id)
            const url = `https://www.strava.com/api/v3/activities/${activity_id}`;

            return Axios.get(url, this.authHeader(accessToken))
        },

        getActivities: async function(user, start_date) {
            return this.getAthleteActivities(user.stravaID, user.accessToken, start_date)
        },

        getAverageStats: async function(userID) {
            console.log(logPrefix, chalk.gray("getAverageStats -> ", userID))
            const stats = await this.getStats(userID)
            if (!stats) return null

            const average = utils.runTotalAverages(stats.recent_run_totals)
            average.username = stats.username
            return average   
        },

        getUser: async function(userID) {
            console.log(logPrefix, chalk.gray("getUser -> ", userID))
            const user = await this.getUserInfo({userID})
            return user
        },

        addActivity: async function({ owner_id, activity_id }) {
            console.log(logPrefix, chalk.gray("addActivity -> ", activity_id))
            const user = await this.getUserInfo({stravaID: owner_id})
            const [activityData, stats] = await Promise.all([
                this.getActivity(activity_id, user.accessToken),
                this.getAthleteStats(user.stravaID, user.accessToken)
            ])

            const activity = activityData.data
            if (activity.type !== "Run") return

            const statsParsed = utils.getActivityStats(activity)
            const averages = utils.runTotalAverages(stats.recent_run_totals)
            const level = levels.calculate(activity, averages, user)

            await $.update({userID: user.userID}, user)

            return {
                level,
                stats: statsParsed,
                user
            }  
        },

        getActivityString({level, stats, user}) {
            console.log(logPrefix, chalk.gray("getActivityString -> "))
            let message = `👏 **${user.user}** just recorded a run! ${stats.distance} mi, ${stats.pace} pace, ${stats.time} time`
            let xp = `${user.level} ${levels.XPBar(user.EXP, 15)} +${level.xp}xp `
            xp += level.bonuses.join(" ")
            xp += level.lvldUp ? '\n⭐ LVL UP!' : ''

            message += "```ini\n" + xp + "```"
        
            return message
        },

        leaderboardLevels: async function() {
            console.log(logPrefix, chalk.gray("leaderboardLevels"))
            const users = await $.getAll()
            return users.sort( (a,b) => {
                if (a.level < b.level) {
                    return 1;
                } else if (a.level > b.level) {
                    return -1;
                } else if (a.EXP < b.EXP) {
                    return 1;
                } else if (a.EXP > b.EXP) {
                    return -1;
                } else {
                    return 0;
                }
            })
        },

        leaderboard: async function() {
            console.log(logPrefix, chalk.gray("leaderboard"))
            const users = await $.getAll()
            const stats = await this.getBatchStats(users)

            return stats.map( s => {
                let json = utils.runTotalAverages(s.recent_run_totals)
                json.user = s.user
                return json
            })
        }
    }
}