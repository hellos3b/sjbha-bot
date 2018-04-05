import express from 'express'
import bodyParser from 'body-parser';
import MeetupModel from '../db/models/MeetupModel';
import ArchiveMeetupModel from '../db/models/ArchiveMeetupModel';
import SwirlCountModel from '../db/models/SwirlCount';

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

    let format = req.query.f;

    if (!format) {
        SwirlCountModel.find()
            .exec( (err, swirlCount) => {
                let json = swirlCount.reduce( (result, item) => {
                    if (!result[item.user]) {
                        result[item.user] = { userID: item.userID, swirls: 0, mentions: [] }
                    }
                    result[item.user].mentions.push({ msg: item.message, timestamp: item.timestamp });
                    result[item.user].swirls = result[item.user].mentions.length;
                    return result;
                }, {});
                res.send(json);
            })
    } else if (format === "leaderboard") {
        SwirlCountModel.find()
            .exec( (err, swirlCount) => {
                let json = swirlCount.reduce( (result, item) => {
                    if (!result[item.user]) {
                        result[item.user] = { userID: item.userID, swirls: 0, mentions: [] }
                    }
                    result[item.user].mentions.push({ msg: item.message, timestamp: item.timestamp });
                    result[item.user].swirls = result[item.user].mentions.length;
                    return result;
                }, {});

                let result = Object.entries(json).map( ([key, obj]) => {
                    return { user: key, userID: obj.userID, mentions: obj.swirls };
                }).sort( (a,b) => b.mentions - a.mentions );

                res.send(result);
            })
    }
})

app.listen(port, () => logger.info(`Listening on port ${port}!`))