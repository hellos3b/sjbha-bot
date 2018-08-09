import express from 'express'
import bodyParser from 'body-parser';
import MeetupModel from '../db/models/MeetupModel';
import ArchiveMeetupModel from '../db/models/ArchiveMeetupModel';
import SwirlCountModel from '../db/models/SwirlCount';

import logger from 'winston'
import PlayersDB from '../boombot/db/PlayersDB'
import Strava from './Strava'
import bots from '../boombot/game/bots'
import channels from "../bot/channels"
import Bot from "../bot/Controller"
import TLDRUI from './tldr.js'
import MemoryUI from './memory.js'
import TLDRDB from '../db/models/TLDRdb'
import MemoryModel from '../db/models/MemoryModel'
import SillyID from 'sillyid'
import Calendar from './calendar.js'

const sid = new SillyID()

const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/static', express.static(__dirname + '/public'))

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

app.get('/db/players.json', (req, res) => {
    let players = PlayersDB.getAll();
    res.send(players);
})

app.get('/tldr', (req, res) => {
    TLDRDB.getAll()
        .then( tldrs => {
            let view = TLDRUI({tldrs: tldrs})
            res.send(view)
        });
})

app.get('/calendar', (req, res) => {
    MeetupModel.find()
        .exec( (err, meetups) => {
            let view = Calendar({meetups})
            res.send(view);
        })
})

app.get('/tldr/:id', (req, res) => {
    let id = req.params.id;

    MemoryModel.findOne({
            readableID: id
        })
        .populate('tldrs')
        .exec( (err, json) => {
            let view = MemoryUI(json);
            res.send(view); 
        });
    // res.send({ id })
})

app.post('/api/memory', function(req, res) {
    let body = req.body;

    if (!body.title || !body.tldrs || !body.tldrs.length) {
        res.status(400).send({
            error: "Missing title or memories"
        });
        return;
    }

    let id = sid.generate();
    MemoryModel.create({
        title: body.title,
        tldrs: body.tldrs,
        readableID: id
    });
    
    res.send({
        id
    });
});

app.post('/api/reddithook', function(req, res) {
    console.log("Reddit webhook fired", req.body);
    let body = req.body;
    Bot.sendMessage({
        to: channels.GENERAL2,
        embed: {
            "author": {
                "name": body.title,
                "url": body.url,
                "icon_url": "https://i.redd.it/rzj02scnpta11.png"
            },
            "color": 16729344
        }
    });

    res.send("ok");
});

Strava.init(app);

app.listen(port, () => logger.info(`Listening on port ${port}!`))