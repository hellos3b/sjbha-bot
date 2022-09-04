let ducks = {}

const MISS_TIMER = 1000 * 30
let onDone = (duck) => {}

export default {

    create(channelID, msgId) {
        ducks[channelID] = {
            msgId,
            channelID,
            active: true,
            shots: [],
            timestamp: new Date()
        }
    },

    onDone(fn) {
        onDone = fn
    },

    bang(bastion, channelID, userID, user, team) {
        if (!ducks[channelID]) return null

        let ts = new Date()
        const duck = ducks[channelID]

        if (duck.active) {
            duck.active = false
            duck.shotTimestamp = ts
            duck.shots.push({
                userID, user, team
            })
            duck.shotTime = ts.getTime() - duck.timestamp.getTime()

            setTimeout(() => {
                const q = new bastion.Queries("FoolsShot")
                q.create({
                    shots: duck.shots,
                    channelID: channelID,
                    timestamp: duck.shotTimestamp
                })

                ducks[channelID] = null
                onDone(duck)
            }, MISS_TIMER) 

            return Object.assign({}, duck, {
                newShot: true
            })
        } else {
            // Check if it's not already in it
            if (!duck.shots.filter(n => n.userID === userID).length) {
                duck.shots.push({ user, userID, team })
            }
        }

        return duck
    }
}