import StravaModel from './StravaModel'
import Axios from 'axios'
import moment from 'moment'
import channels from "../bot/channels"
import Bot from "../bot/Controller"
import { start } from 'repl';

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

function getUserInfoFromStrava(owner_id) {
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

function getUserInfoFromDiscord(userID) {
    return new Promise((resolve, reject) => {
        StravaModel.findOne({ userID: userID })
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

function dateString(date) {
    return date.getMonth() + "-" + date.getDate();
}

function hhmmss(secs, leadingZero) {
  var minutes = Math.floor(secs / 60);
  secs = secs%60;
  var hours = Math.floor(minutes/60)
  minutes = minutes%60;
  let result = "";
  if (hours > 0) {
      result += hours+":";
  }
  if (leadingZero) {
      if (minutes < 10) {
          minutes = "0"+minutes;
      }
  }
  result += `${minutes}:${pad(secs)}`;
  return result;
}

function getAllUsers() {
    return new Promise((resolve, reject) => {
        StravaModel.find()
            .exec( (err, users) => {
                if (err) {
                    console.error("couldn't find user", owner_id);
                    reject(err);
                }
                resolve(users);
            });
    })
}

function getAthleteStats(owner_id, access_token, user) {
    let url = `https://www.strava.com/api/v3/athletes/${owner_id}/stats`;

    return Axios.get(url, {
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    }).then( res => {
        let data = res.data;
        data.username = user;
        return data; 
    });;
}

function getAthleteActivities(owner_id, access_token, start_date) {
    let epoch = start_date.getTime() / 1000;
    let url = `https://www.strava.com/api/v3/athlete/activities?after=${epoch}&page=1`;

    return Axios.get(url, {
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    }).then( res => res.data );
}

function getPace(distance, moving_time) {

}

async function notifyCreate(owner_id, activity_id) {
    console.log("notifyCreate", owner_id, activity_id);
    let user = await getUserInfoFromStrava(owner_id);
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

function getBatchStats(users) {
    let promises = users.map( n => getAthleteStats(n.stravaID, n.accessToken, n.user));
    return Promise.all(promises);
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
    },

    getMiles: function(x) {
        return getMiles(x);
    },

    hhmmss: function(sec, leadingZero) {
        return hhmmss(sec, leadingZero);
    },

    getStats: async function(userID) {
        let user = await getUserInfoFromDiscord(userID);

        if (!user) {
            return null;
        }

        let data = await getAthleteStats(user.stravaID, user.accessToken, user.user);
        data.username = user.user;
        return data;
    },

    getLeaderboard: async function() {
        let users = await getAllUsers();
        let stats = await getBatchStats(users);
        let leaderboard = stats.map( s => {
                let json = s.recent_run_totals;
                json.user = s.username;
                return json;
            }).sort( (a, b) => {
                if (a.moving_time > b.moving_time) {
                    return -1;
                } else if (a.moving_time < b.moving_time) {
                    return 1;
                } else {
                    return 0;
                }
            });
        console.log("leaderboard", leaderboard);
        return leaderboard;
    },

    getCalendar: async function(userID) {
        let user = await getUserInfoFromDiscord(userID);

        if (!user) {
            return null;
        }

        let start_date = new Date();
        start_date.setDate(start_date.getDate() - 28);
        start_date.setDate(start_date.getDate() - start_date.getDay());

        let data = await getAthleteActivities(user.stravaID, user.accessToken, start_date);

        // Convert into a hashmap of datestring
        let dates = data.map(n => {
            let date = new Date(n.start_date);
            return dateString(date);
        }).reduce( (res, obj) => {
            res[obj] = true;
            return res;
        }, {})

        let cal = `S  M  T  W  T  F  S`;
        let tomorrow = new Date();
        let today = dateString(new Date());
        tomorrow.setDate(tomorrow.getDate() + 1);
        let t = dateString(tomorrow);
        let c = dateString(start_date);

        while (c != t) {
            if (start_date.getDay() === 0) {
                cal += "\n";
            }
            if (dates[c]) {
                cal += "✓  ";
            } else {
                if (c === today) {
                    cal += "o  ";
                } else {
                    cal += "-  ";
                }
            }
            start_date.setDate(start_date.getDate() + 1);
            c = dateString(start_date);
        }

        return cal;
    },

    getAverage: async function(userID) {
        let user = await getUserInfoFromDiscord(userID);
        console.log("user", user);
        if (!user) {
            return null;
        }

        let start_date = new Date();
        start_date.setDate(start_date.getDate() - 28);

        let data = await getAthleteActivities(user.stravaID, user.accessToken, start_date);

        let dist_total = 0;
        let pace_total = 0;
        for (var i = 0; i < data.length; i++) {
            let distance = getMiles(data[i].distance);
            let seconds_pace = Math.round(data[i].moving_time / distance);
            dist_total += distance;
            pace_total += seconds_pace;
        }

        let dist_avg = dist_total / data.length;
        dist_avg = Math.floor(dist_avg * 100) / 100;
        let pace_avg = Math.round(pace_total / data.length);

        return {
            total: data.length,
            name: user.user,
            distance: dist_avg,
            pace: hhmmss(pace_avg)
        };
    }
}