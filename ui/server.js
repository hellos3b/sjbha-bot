import express from 'express'

import MeetupsDB from '../bot/MeetupsDB'

export default {
    start() {
        const app = express()

        app.get('/meetups.json', (req, res) => {
            let json = MeetupsDB.getMeetups();
            res.send(json)
        });
        
        app.get('/archive.json', (req, res) => {
            let json = MeetupsDB.getArchive();
            res.send(json)
        });
        
        app.listen(8080, () => console.log('Listening on port 8080!'))
    }
}