import Axios from "axios";
import chalk from "chalk";
import levels from "./levels";
import utils from "./utils";
import challenges from "./challenges";
import {getAccessToken} from './Auth'

const logPrefix = `    ` + chalk.blue("[Strava]");

const dateID = date => {
  const month = date.getMonth();
  const day = date.getDate();
  return `${month}-${day}`;
};

export default bastion => {
  const $ = new bastion.Queries("stravaID");

  return {
    /**
     * Provides the header for REST calls to the Strava api
     * @param {string} token User's Token
     */
    authHeader(token) {
      return {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
    },

    /**
     * Get user data via search query
     * @param {object} obj
     */
    getUserInfo: async function(obj) {
      console.log(logPrefix, chalk.gray("getAthlete -> "), obj);
      const user = await $.findOne(obj);
      if (!user.refreshToken) return null;
      return user;
    },

    getAthleteStats: async function(owner_id, accessToken) {
      if (!accessToken) {
        return null;
      }
      const url = `https://www.strava.com/api/v3/athletes/${owner_id}/stats`;
      return Axios.get(url, this.authHeader(accessToken))
        .then(r => r.data)
        .catch(err => {
          return null;
        });
    },

    getAthleteActivities(owner_id, access_token, start_date) {
      console.log(logPrefix, chalk.gray("getAthleteActivities -> "), owner_id);
      const epoch = start_date.getTime() / 1000;
      const url = `https://www.strava.com/api/v3/athlete/activities?after=${epoch}&per_page=100`;

      return Axios.get(url, this.authHeader(access_token)).then(
          res => res.data
        ).catch( r => [])
        .then( r => r.filter(n => n.type === 'Run'));
    },

    getStats: async function(userID) {
      console.log(logPrefix, chalk.gray("getStats -> ", userID));
      const user = await this.getUserInfo({ userID });
      await user.updateToken()

      if (!user) return null;

      const stats = await this.getAthleteStats(user.stravaID, user.accessToken);
      console.log("Stats", stats);
      if (!stats) return null;

      stats.username = user.user;
      stats.level = user.level;
      stats.xp = user.EXP;

      return stats;
    },

    getBatchStats: async function(users) {
      console.log(logPrefix, chalk.gray("getBatchStats -> "), users.length);
      const promises = users.map(n => {
        return this.getAthleteStats(n.stravaID, n.accessToken).then(json => {
          if (!json) return null;
          json.user = n.user;
          json.userID = n.userID;
          return json;
        });
      });
      return Promise.all(promises).then(res => res.filter(n => n));
    },

    getBatchActivities: async function(users) {
      console.log(logPrefix, chalk.gray("getBatchActivities -> "), users.length);
      const promises = users.map(n => {
        return this.getLastMonthActivities(n).then(activities => {
          if (!activities.length) return null;
          return {
            activities,
            user: n.user,
            userID: n.userID
          };
        });
      });
      return Promise.all(promises).then(res => res.filter(n => n));
    },

    getActivity(activity_id, accessToken) {
      console.log(logPrefix, chalk.gray("getActivity -> "), activity_id);
      const url = `https://www.strava.com/api/v3/activities/${activity_id}`;

      return Axios.get(url, this.authHeader(accessToken));
    },

    getActivities: async function(user, start_date) {
      return this.getAthleteActivities(
        user.stravaID,
        user.accessToken,
        start_date
      );
    },

    getLastMonthActivities: async function(user) {
      const start_date = new Date()
      start_date.setDate(start_date.getDate() - 28)
      start_date.setDate(start_date.getDate() - start_date.getDay())

      return this.getActivities(user, start_date)
    },

    getAverageStats: async function(userID) {
      console.log(logPrefix, chalk.gray("getAverageStats -> ", userID));
      const stats = await this.getStats(userID);
      if (!stats) return null;

      const average = utils.runTotalAverages(stats.recent_run_totals);
      average.username = stats.username;
      return average;
    },

    getUser: async function(userID) {
      console.log(logPrefix, chalk.gray("getUser -> ", userID));
      const user = await this.getUserInfo({ userID });
      await user.updateToken()
      return user;
    },

    getAllWithTokens: async function() {
      let users = await $.getAll()
      users = users.filter(u => !!u.refreshToken)
      return Promise.all( users.map( u => u.updateToken() ))
    },

    addActivity: async function({ owner_id, activity_id }) {
      console.log(logPrefix, chalk.gray("addActivity -> ", activity_id));
      const user = await this.getUserInfo({ stravaID: owner_id });
      await user.updateToken()

      const ignoreList = new Set(["213248932078288896"]);

      if (ignoreList.has(user.userID)) return;

      let addXP = true;
      // limit to 1 level a day
      if (user.lastRun) {
        const a = dateID(new Date());
        const b = dateID(new Date(user.lastRun));

        if (a === b) {
          addXP = false;
        }
      }

      const [activityData, stats] = await Promise.all([
        this.getActivity(activity_id, user.accessToken),
        this.getAthleteStats(user.stravaID, user.accessToken)
      ]);

      const activity = activityData.data;
      if (activity.type !== "Run") return;

      const statsParsed = utils.getActivityStats(activity);
      const averages = utils.runTotalAverages(stats.recent_run_totals);
      let level = null;
      if (addXP) {
        level = levels.calculate(activity, averages, user);

        if (level.challengeDone) {
          user.challenge.finished = true;
        }
      }

      user.lastRun = new Date();
      await $.update({ userID: user.userID }, user);

      return {
        activity,
        level,
        stats: statsParsed,
        user
      };
    },

    getActivityString({ activity, level, stats, user }) {
      console.log(logPrefix, chalk.gray("getActivityString -> "));
      const verb = activity.manual ? "logged" : "recorded";
      let message = `👏 **${user.user}** just ${verb} a run! - *${
        activity.name
      }*\n\`\`\`📍${stats.distance} mi   🏃${stats.pace} pace   🕒${
        stats.time
      } time\`\`\``;

      if (level) {
        let xp = `${user.level} ${levels.XPBar(user.EXP, 15)} +${level.xp}xp `;
        xp += level.bonuses.join(" ");
        xp += level.challengeDone
          ? `\n👏 Weekly Challenge! +${levels.CHALLENGE_BONUS}xp`
          : "";
        xp += level.lvldUp ? "\n⭐ LVL UP!" : "";

        message += "```ini\n" + xp + "```";
      }

      return message;
    },

    leaderboardLevels: async function() {
      console.log(logPrefix, chalk.gray("leaderboardLevels"));
      const users = await $.getAll();
      return users.sort((a, b) => {
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
      });
    },

    leaderboard: async function() {
      const users = await this.getAllWithTokens()
      const stats = await this.getBatchStats(users);

      return stats.map(s => {
        let json = utils.runTotals(s.recent_run_totals);
        json.user = s.user;
        return json;
      });
    },

    getAllActivities: async function() {
      const users = await this.getAllWithTokens()
      return this.getBatchActivities(users);    
    },

    getAllAverages: async function() {
      const users = await this.getAllWithTokens()
      const stats = await this.getBatchStats(users);

      return stats.map(s => {
        let json = utils.runTotalAverages(s.recent_run_totals);
        json.user = s.user;
        json.userID = s.userID;
        return json;
      });
    },

    saveChallenge: async function(userID, challenge) {
      if (challenge) challenge.finished = false;
      return $.update({ userID }, { challenge });
    },

    resetChallenges: async function() {
      const activities = await this.getAllActivities();

      // Only if you have 4 or more runs do you qualify
      const newChallenge = challenges.randomizeChallenge();

      return Promise.all(
        activities.map(activity => {
          const {activities} = activity

          let challenge = null;
          if (activities.length >= 4) {
            challenge = challenges.create(newChallenge, activity);
          }

          return this.saveChallenge(activity.userID, challenge);
        })
      );
    },

    saveTrends: async function() {
      const averages = await this.getAllAverages();

      for (var i = 0; i < averages.length; i++) {
        const user = await this.getUserInfo({ userID: averages[i].userID })
        const avg = averages[i]

        if (avg.total < 4) continue;

        const avgs = user.averages

        avgs.push({
          pace_seconds: avg.pace_seconds,
          distance: avg.distance,
          time: avg.time,
          total: avg.total
        })

        await $.update({ userID: avg.userID }, { averages: avgs })
      }

      console.log("AVERAGES", averages)
    }
  };
};
