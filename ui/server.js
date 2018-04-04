import express from 'express'
import bodyParser from 'body-parser';
import MeetupModel from '../db/models/MeetupModel';
import ArchiveMeetupModel from '../db/models/ArchiveMeetupModel';

import logger from 'winston'

const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let port = ( process.env.PORT || 3000 );

console.log(__dirname);

app.get('/', (req, res) => {
    logger.info("get /")
    res.send("Up and running!")
})

app.get('/db/meetups.json', (req,res) => {
    logger.info("get /db/meetups.json")
    MeetupModel.find()
        .exec( (err, meetups) => {
            res.send(meetups);
        })
})

app.get('/db/archive.json', (req,res) => {
    logger.info("get /db/archive.json")
    ArchiveMeetupModel.find()
        .exec( (err, meetups) => {
            res.send(meetups);
        })
})

app.get('/db/swirls.json', (req,res) => {
    logger.info("get /db/swirls.json")
    ArchiveMeetupModel.find()
        .exec( (err, meetups) => {
            res.send(meetups);
        })
})

app.listen(port, () => logger.info(`Listening on port ${port}!`))