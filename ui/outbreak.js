import mustache from 'mustache'
import requireText from 'require-text'
import moment from 'moment'

let template =  requireText('./outbreak.html', require)

function pad(v) {
    return (v < 10) ? `0${v}` : v;
}
function msToHMS( ms ) {
    // 1- Convert to seconds:
    var seconds = ms / 1000;
    // 2- Extract hours:
    var hours = parseInt( seconds / 3600 ); // 3,600 seconds in 1 hour
    seconds = Math.floor(seconds % 3600); // seconds remaining after extracting hours
    // 3- Extract minutes:
    var minutes = parseInt( seconds / 60 ); // 60 seconds in 1 minute
    // 4- Keep only seconds not extracted to minutes:
    seconds = Math.floor(seconds % 60);
    return pad(hours)+":"+pad(minutes);
}

function parseData(data) {
    const start = data.infections.reduce( (d, obj) => {
        const ts = new Date(obj.timestamp);
        return (ts < d) ? ts : d;
    }, new Date());

    console.log("start time", start);

    data.infections = data.infections.map( n => {
        const diff = new Date(n.timestamp).getTime() - start.getTime();
        console.log("diff time", diff);
        n.timeDiff = msToHMS(diff);
        n.message = n.message.replace(n.userID, n.user);
        n.message = n.message.replace("125829654421438464", "s3b");

        if (!n.user) {
            n.user = "unknown";
        }

        let action = "";
        if (n.infection === "infected") {
            action = "got infected by";
        } else if (n.infection === "vaccine") {
            action = "got immunity from";
        } 
        n.action = action;
        n.isInfected = n.infection === "infected";
        return n;
    }).sort( (a,b) => a.timestamp < b.timestamp ? -1 : 1 );
    return data;
}

function leaderboard(data) {
    let users = data.reduce( (users, n) => {
        if (!users[n.infectedBy]) {
            users[n.infectedBy] = {
                name: n.infectedBy,
                count: 0,
                infection: n.infection
            };
        }
        users[n.infectedBy].count++;
        return users;
    }, {});
    let infected = [], immune = [];
    for (var k in users) {
        if (users[k].infection === "infected") {
            infected.push(users[k]);
        } else {
            immune.push(users[k]);
        }
    }
    infected = infected.sort( (a,b) => a.count > b.count ? -1: 1 );
    immune = immune.sort( (a,b) => a.count > b.count ? -1: 1);

    return {
        infected, immune
    };
}

export default (data) => {
    let d = parseData(data);
    d.group = {
        infected: d.infections.filter(n => n.infection === "infected"),
        immune: d.infections.filter(n => n.infection === "vaccine")
    };
    d.leaders = leaderboard(d.infections);
    console.log(d.leaders);
    return mustache.render(template, d)
}