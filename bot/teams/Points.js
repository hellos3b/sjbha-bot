import TeamDB from './TeamDB'
import MeetupsDB from '../MeetupsDB'

const YES_POINTS = 3;
const MAYBE_POINTS = 1;

export default {

    getPointsForOne: async function(user) {
        let person = await TeamDB.findUserByName(user);

        if (!person) {
            return null;
        }

        let archive = await MeetupsDB.getArchive();

        let x = new Date("6/1/2018");

        archive = archive.filter( arc => {
            let d = new Date(arc.date);
            return x < d;
        }).map( a => {
            let yes = a.reactions.yes.map( n => n.id);
            let maybe = a.reactions.maybe.map( n => n.id);
            a.sets = {
                yes: new Set(yes),
                maybe: new Set(maybe)
            }
            return a;
        });

        let p = 0;
        let y = 0;
        let m = 0;

        let id = person.userID;
        for (var j = 0; j < archive.length; j++) {
            if (archive[j].sets.yes.has(id)) {
                p += YES_POINTS;
                y++;
            }
            if (archive[j].sets.maybe.has(id)) {
                p += MAYBE_POINTS;
                m++;
            }
        }

        return {
            total: p,  
            yes: y,
            maybe: m
        };
    },

    getPoints: async function() {
        let people = await TeamDB.getAll();
        let archive = await MeetupsDB.getArchive();

        console.log("people", people);

        let x = new Date("6/1/2018");

        archive = archive.filter( arc => {
            let d = new Date(arc.date);
            return x < d;
        }).map( a => {
            let yes = a.reactions.yes.map( n => n.id);
            let maybe = a.reactions.maybe.map( n => n.id);
            a.sets = {
                yes: new Set(yes),
                maybe: new Set(maybe)
            }
            return a;
        });

        console.log("archive length", archive.length);

        let Teams = {
            "Pink Bombers": 0,
            "Green Mafia": 0,
            "Resistance": 0
        };

        for (var i = 0; i < people.length; i++) {
            let p = 0;
            let y = 0;
            let m = 0;
            let id = people[i].userID;
            let team = people[i].team;
            for (var j = 0; j < archive.length; j++) {
                if (archive[j].sets.yes.has(id)) {
                    p += YES_POINTS;
                    Teams[team] += YES_POINTS;
                    y++;
                }
                if (archive[j].sets.maybe.has(id)) {
                    Teams[team] += MAYBE_POINTS;
                    p += MAYBE_POINTS;
                    m++;
                }
            }
            console.log(`${people[i].user}: ${p}.${y}.${m}`);
        }

        console.log(Teams);

        return Teams;
    }

}