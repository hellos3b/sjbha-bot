
let ducks = {}

export default {

    create(channelID, msgId) {
        ducks[channelID] = msgId
    },

    bang(channelID) {
        if (!ducks[channelID]) return null

        const msgId = ducks[channelID]

        ducks[channelID] = null

        return msgId
    }
}