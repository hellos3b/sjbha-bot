import Axios from 'axios'
import { Router } from 'express'
import chalk from "chalk"
import "./schema"
import utils from './utils'

const challenges = [
    {
        type: "distance",
        multi: 1.1,
        name: "Go the Distance"
    },
    {
        type: "time",
        multi: 1.1,
        name: "Stay out Longer"
    },
    {
        type: "pace",
        multi: 0.98,
        distanceMulti: 0.85,
        name: "Run Faster"
    }
]

export default {

    randomizeChallenge() {
        const d = new Date();
        const rng = d.getDate() % 3

        return challenges[rng]
    },

    getAverage(challenge, {activities, user, userID}) {
        const sampleSize = Math.ceil(activities.length * 0.25)
        let samples = [];
        if (challenge.type === "pace") {
            samples = activities
                .sort( (a, b) => a.average_speed > b.average_speed ? -1 : 1)
        } else if (challenge.type === "distance") {
            samples = activities
                .sort( (a, b) => a.distance > b.distance ? -1 : 1)
        } else if (challenge.type === "time") {
            samples = activities
                .sort( (a, b) => a.moving_time > b.moving_time ? -1 : 1)
        }

        samples = samples.slice(0, sampleSize)
            .map(a => utils.getActivityStats(a))
            .reduce( (l, r) => {
                l.moving_time += r.moving_time
                l.distance += r.distance
                l.pace_seconds += r.pace_seconds
                return l
            }, {
                moving_time: 0,
                distance: 0,
                pace_seconds: 0
            })
        
        const averages = {
            moving_time: samples.moving_time / sampleSize,
            distance: samples.distance / sampleSize,
            pace_seconds: samples.pace_seconds / sampleSize
        };

        averages.pace = utils.hhmmss(averages.pace_seconds)
        averages.time = utils.hhmmss(averages.moving_time)
    
        return averages
    },

    create(challenge, activities) {
        let targets = {
            distance: null,
            time: null,
            pace_seconds: null
        }  

        const averages = this.getAverage(challenge, activities);
      
        if (challenge.type === "time") {
            targets.time = averages.moving_time * challenge.multi

            console.log(activities.user, " time: ", utils.hhmmss(targets.time))
        }
        if (challenge.type === "distance") {
            targets.distance = Math.round(averages.distance * challenge.multi * 100)/100

            console.log(activities.user, " distance: ", targets.distance)
        }
        if (challenge.type === "pace") {
            targets.pace_seconds = averages.pace_seconds * challenge.multi
            targets.distance = Math.round(averages.distance * challenge.distanceMulti * 100)/100

            console.log(activities.user, "pace: ", `${targets.distance}mi`, utils.hhmmss(targets.pace_seconds))
        }

        const result = {
            challenge,
            targets
        }

        console.log('create challenge', result)
        return result
    },

    test(stats, user) {
        if (!user.challenge) return false
        if (user.challenge.finished) return false

        const challenge = user.challenge.challenge
        const targets = user.challenge.targets

        if (challenge.type === "time") {
            return stats.moving_time >= targets.time
        }
        if (challenge.type === "distance") {
            return stats.distance >= targets.distance
        }
        if (challenge.type === "pace") {
            return stats.distance >= targets.distance && stats.pace_seconds <= targets.pace_seconds
        }
        return false
    }

}