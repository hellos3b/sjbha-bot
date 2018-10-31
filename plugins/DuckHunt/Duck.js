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
                ducks[channelID] = null
            }, MISS_TIMER) 

            return Object.assign({}, duck, {
                newShot: true
            })
        } else {
            duck.misses.push({ user, userID })
        }

        return duck
    }
}