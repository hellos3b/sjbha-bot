let ducks = {}

const MISS_TIMER = 1000 * 5
let onDone = (duck) => {}

export default {

    create(channelID, msgId) {
        ducks[channelID] = {
            msgId,
            channelID,
            active: true,
            misses: [],
            timestamp: new Date()
        }
    },

    onDone(fn) {
        onDone = fn
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
            duck.shotBy = { userID, user, shotTimestamp: ts }
            duck.shotTime = ts.getTime() - duck.timestamp.getTime()

            setTimeout(() => {
                const q = new bastion.Queries("DuckhuntShot-s3")
                q.create({
                    shotBy: duck.shotBy,
                    misses: duck.misses,
                    channelID: channelID,
                    timestamp: duck.shotTimestamp,
                    spawnTimestamp: duck.timestamp
                })

                this.saveMisses(new bastion.Queries("Duckhunt-s3"), duck.misses)
                ducks[channelID] = null
                onDone(duck)
            }, MISS_TIMER) 

            return Object.assign({}, duck, {
                newShot: true
            })
        } else {
            // Check if it's not already in it
            if (userID !== duck.shotBy.userID && !duck.misses.filter(n => n.userID === userID).length) {
                duck.misses.push({ user, userID, shotTimestamp: new Date() })
            }
        }

        return duck
    }
}