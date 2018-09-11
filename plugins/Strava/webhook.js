import { Router } from 'express'
import { EventEmitter } from 'events'
import chalk from 'chalk'

export default class extends EventEmitter {

    constructor() {
        super()
    }

    router() {
        const router = Router()

        // Validates the webook
        router.get('/webhook', (req, res) => {
            const challenge = req.query["hub.challenge"]
            res.send({"hub.challenge": challenge})
        })

        // Posted when a webhook is fired
        router.post('/webhook', (req, res) => {
            console.log(chalk.blue("[Strava]"), chalk.gray(`Webhook POST request`))
            const body = req.body
            if (body.aspect_type === "create") { //&& body.object_type === "activity") {
                this.emit("activity", {
                    activity_id: body.object_id, 
                    owner_id: body.owner_id
                })
            }
            res.send("posted")
        })

        return router
    }
}