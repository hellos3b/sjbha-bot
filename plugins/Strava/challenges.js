import Axios from 'axios'
import { Router } from 'express'
import chalk from "chalk"
import "./schema"
import utils from './utils'

const challenges = [
    {
        type: "distance",
        multi: 1.5,
        name: "Go the Distance"
    },
    {
        type: "time",
        multi: 1.3,
        name: "Stay out Longer"
    },
    {
        type: "pace",
        multi: 0.96,
        distanceMulti: 0.75,
        name: "Run Faster"
    }
]

export default {

    randomizeChallenge() {
        const d = new Date();
        const rng = d.getDate() % 3
        return challenges[rng]
    },

    create(challenge, averages) {
        let targets = {
            distance: null,
            time: null,
            pace_seconds: null
        }
        if (challenge.type === "time") {
            targets.time = averages.time * challenge.multi
        }
        if (challenge.type === "distance") {
            targets.distance = Math.round(averages.distance * challenge.multi * 100)/100
        }
        if (challenge.type === "pace") {
            targets.pace_seconds = averages.pace_seconds * challenge.multi
            targets.distance = Math.round(averages.distance * challenge.distanceMulti * 100)/100
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