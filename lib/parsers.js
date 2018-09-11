export default {

    pipe(msg) {
        return [msg.split("|")]
    },

    split(msg) {
        return [msg.split(" ")]
    },

    args(options) {
        return function(msg, context) {
            const split = msg.split(" ")
            return options.map( (n, i) => {
                if (n === "@target") {
                    return this.bastion.helpers.mentionID(split[i] || context.userID)
                }
                if (n === "@mention") {
                    return this.bastion.helpers.mentionID(split[i] || context.userID)
                }
                return split[i]
            })
        }
    }
    
}