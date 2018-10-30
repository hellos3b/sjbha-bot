
let ducks = {}

export default {

    create(channelID, msgId) {
        ducks[channelID] = msgId
    },

    bang(channelID) {
        if (!ducks[channelID]) return null

        return ducks[channelID]
    }
}