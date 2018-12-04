let ducks = {}

const MISS_TIMER = 1000 * 5


export default {

    create(channelID, msgId) {
        ducks[channelID] = {
            msgId,
            active: true,
            misses: [],
            timestamp: new Date()
        }
    },

    saveMisses: async function(q, misses) {
        console.log("saveMisses", misses)

        for (var i = 0; i < misses.length; i++) {
            let userID = misses[i].userID
            let player = await q.findOne({ userID })
            if (!player) {
                q.create({
                    user: misses[i].user, 
                    userID,
                    count: 0,
                    misses: 1
                })
            } else {
                player.misses++
                q.update({ userID }, player)
            }
        }
    },

    bang(bastion, channelID, userID, user) {
        if (!ducks[channelID]) return null

        let ts = new Date()
        const duck = ducks[channelID]

        if (duck.active) {
            duck.active = false
            duck.shotTimestamp = ts
            duck.shotBy = { userID, user }
            duck.shotTime = ts.getTime() - duck.timestamp.getTime()

            setTimeout(() => {
                const q = new bastion.Queries("DuckhuntShot")
                q.create({
                    shotBy: duck.shotBy,
                    misses: duck.misses,
                    channelID: channelID,
                    timestamp: duck.shotTimestamp
                })

                this.saveMisses(new bastion.Queries("Duckhunt"), duck.misses)
                ducks[channelID] = null
            }, MISS_TIMER) 

            return Object.assign({}, duck, {
                newShot: true
            })
        } else {
            // Check if it's not already in it
            if (userID !== duck.shotBy && !duck.misses.filter(n => n.userID === userID).length) {
                duck.misses.push({ user, userID })
            }
        }

        return duck
    }
}