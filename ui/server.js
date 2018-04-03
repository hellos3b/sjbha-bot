import express from 'express'

import MeetupsDB from '../bot/MeetupsDB'
import logger from 'winston'

export default {
    start() {
        const app = express()

        app.get('/', (req, res) => {
            logger.info("get /")
            res.send("Up and running!")
        })

        app.get('/meetups.json', (req, res) => {
            logger.info("get /meetups.json")
            let json = MeetupsDB.getMeetups();
            res.send(json)
        });
        
        app.get('/archive.json', (req, res) => {
            logger.info("get /archive.json")
            let json = MeetupsDB.getArchive();
            res.send(json)
        });
        
        app.listen(80, () => console.log('Listening on port 80!'))
    }
}