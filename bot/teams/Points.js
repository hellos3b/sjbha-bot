import TeamDB from './TeamDB'
import MeetupsDB from '../MeetupsDB'

export default {

    getPoints: async function() {
        let people = await TeamDB.getAll();
        let archive = await MeetupsDB.getArchive();

        console.log("people", people);

        let x = new Date("6/1/2018");

        archive = archive.filter( arc => {
            let d = new Date(arc.date);
            return x > d;
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
            "Green Mafia": 0
        };

        for (var i = 0; i < people.length; i++) {
            let id = people[i].userID;
            let team = people[i].team;
            console.log(`Looking at id ${people[i].user}, team: ${team}`);
            for (var j = 0; j < archive.length; j++) {
                if (archive[j].sets.yes.has(id)) {
                    Teams[team] += 2;
                }
                if (archive[j].sets.maybe.has(id)) {
                    Teams[team] += 1;
                }
            }
        }

        return Teams;
    }

}