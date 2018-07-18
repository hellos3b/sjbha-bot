import StravaModel from './StravaModel'
import Axios from 'axios'
import moment from 'moment'
import channels from "../bot/channels"
import Bot from "../bot/Controller"

// For authenticating
let STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
let REDIRECT_URL = 'https://sjbha-bot.herokuapp.com/api/strava/accept';

function saveOwnerID(userID, code) {
    let client_id = process.env.STRAVA_CLIENT_ID;
    let client_secret = process.env.STRAVA_CLIENT_SECRET;
    // auth and get owner ID
    Axios.post(STRAVA_TOKEN_URL, {
        client_id: client_id,
        client_secret: client_secret,
        code: code
    })
    .then( res => {
        let owner_id = res.data.athlete.id;
        let access_token = res.data.access_token;
        console.log(`Saving oid ${owner_id} at ${access_token}`);

        StravaModel.update({ 
                userID: userID
            }, {
                $set: { 
                    'stravaID': owner_id,
                    'accessToken': access_token 
                }
            }, function(err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("Saved strava owner ID");
                }
            });
    });
}

function getUserInfo(owner_id) {
    console.log("getUserInfo", owner_id);
    return new Promise((resolve, reject) => {
        StravaModel.findOne({ stravaID: owner_id })
            .exec( (err, user) => {
                if (err) {
                    console.error("couldn't find user", owner_id);
                    reject(err);
                }
                console.log("result", user);
                resolve(user);
            });
    })
}

function getActivityData(activity_id, access_token) {
    let url = `https://www.strava.com/api/v3/activities/${activity_id}`;
    
    return Axios.get(url, {
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    });
}

// helper functions for formatting
function getMiles(i) {
    let n = i*0.000621371192;
    return Math.round( n * 100 ) / 100;
}

function pad(num) {
    return ("0"+num).slice(-2);
}
function hhmmss(secs) {
  var minutes = Math.floor(secs / 60);
  secs = secs%60;
  var hours = Math.floor(minutes/60)
  minutes = minutes%60;
  let result = "";
  if (hours > 0) {
      result += hours+":";
  }
  result += `${minutes}:${pad(secs)}`;
  return result;
}

async function notifyCreate(owner_id, activity_id) {
    console.log("notifyCreate", owner_id, activity_id);
    let user = await getUserInfo(owner_id);
    let activity = await getActivityData(activity_id, user.accessToken);

    console.log("GOT ACTIVITY!", activity.data);
    let data = activity.data;

    if (data.type !== "Run") {
        console.log("not a run, ignoring");
        return;
    }

    let distance = getMiles(data.distance);
    let seconds_pace = Math.round(data.moving_time / distance);
    let pace = hhmmss( seconds_pace );
    let details = {
        name: user.user,
        distance,
        time: hhmmss(data.moving_time),
        pace
    };

    console.log("WORKOUT DETAILS", details);
    await sendUpdate(details);
}

async function sendUpdate(data) {
    let message = `👏 **${data.name}** just recorded a run! ${data.distance} mi, ${data.pace} pace, ${data.time} time`;
    await Bot.sendMessage({
        to: channels.RUN,
        message
    });
}

export default {
    init(app) {
        // Used for the redirect, needs ?user=&userID from discord
        app.get('/api/strava/auth', function(req, res) {
            let user = req.query.user;
            let userID = req.query.userID;
            let client_id = process.env.STRAVA_CLIENT_ID;
            let redirect_uri = REDIRECT_URL;
            let url = `https://www.strava.com/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&state=${userID}`;

            StravaModel.findOne({ userID: userID }, (err, person) => {
                let json = { user, userID };
                const contact = (person) ? person.set(json) : new StravaModel(json);
            
                contact.save((saveErr, savedContact) => {
                    if (saveErr) throw saveErr;
                    console.log(savedContact);
                });
            });

            console.log("Request to auth strava for ", user);
            res.redirect(url);
        });
        
        // Register the webook
        app.get('/api/strava/webhook', function(req, res) {
            let challenge = req.query["hub.challenge"];
            res.send({"hub.challenge": challenge});
        });
        
        // Called when an event is triggered
        app.post('/api/strava/webhook', function(req, res) {
            console.log("Strava webhook fired", req.body);
            let body = req.body;
            if (body.aspect_type === "create") { //&& body.object_type === "activity") {
                let activity_id = body.object_id;
                let owner_id = body.owner_id;
                notifyCreate(owner_id, activity_id);
            }
            res.send("posted");
        });
        
        // Accept the token, save the user into the DB (username -> id match)
        app.get('/api/strava/accept', function(req, res) {
            let userID = req.query.state;
            let code = req.query.code;
            
            saveOwnerID(userID, code);
            res.send("Alright, you're strava is now hooked to the discord bot! 👍<p>The bot will ping the 5k channel when you record a run");
        });
    }
}