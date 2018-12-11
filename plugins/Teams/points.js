export default (bastion, config) => {
    const q = new bastion.Queries('TeamSchema')
    const archives = new bastion.Queries('MeetupArchive')
    
    return {

        getPointsForOne: async function(user) {
            const person = await q.findOne({user})

            if (!person) return null

            let archive = await archives.getAll()

            let x = new Date(config.startDate);

            archive = archive.filter( arc => {
                let d = new Date(arc.date);
                return x < d;
            }).map( a => {
                a.sets = {
                    yes: new Set(a.reactions.yes.map( n => n.id)),
                    maybe: new Set(a.reactions.maybe.map( n => n.id))
                }
                return a;
            });

            let p = 0;
            let y = 0;
            let m = 0;

            let id = person.userID;
            for (var j = 0; j < archive.length; j++) {
                if (archive[j].sets.yes.has(id)) {
                    p += config.yes;
                    y++;
                }
                if (archive[j].sets.maybe.has(id)) {
                    p += config.maybe;
                    m++;
                }
            }

            return {
                total: p,  
                yes: y,
                maybe: m
            };
        },

        getRSVPIds: async function(startDate) {
            const archive = await archives.getAll()
            const start = new Date(startDate)

            return archive.filter( entry => start < new Date(entry.date))
                .reduce( (res, entry) => {
                    const yes = entry.reactions.yes.map( n => n.id)
                    const maybe = entry.reactions.maybe.map( n => n.id)
                    return {
                        y: res.y.concat(yes),
                        m: res.m.concat(maybe)
                    }
                }, { y: [], m: [] })
        },

        getRSVPs: async function(users) {
            const rsvps = await this.getRSVPIds(config.startDate)

            return users.map( n => {
                const yes = rsvps.y.filter(item => item === n.userID ).length
                const maybe = rsvps.m.filter(item => item === n.userID ).length
                return {
                    user: n.user,
                    userID: n.userID,
                    team: n.team,
                    oldTeam: n.oldTeam,
                    resist: n.resist,
                    guardian: n.guardian,
                    uprising: n.uprising,
                    yes, maybe,
                    points: yes * config.yes + maybe * config.maybe
                }
            })
        }

    }
}