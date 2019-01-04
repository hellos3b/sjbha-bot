/** @typedef {import('@/types').Parser} Parser */
export default {

    /** 
     * Split the message with '|' into an array
     * @type {Parser}
    */
    pipe(msg) {
        return [msg.split("|")]
    },

    /** 
     * Splits the message via spaces
     * @type {Parser}
    */
    split(msg) {
        return [msg.split(" ")]
    },

    /** 
     * Maps the message to an array. Helpful if you want to auto deconstruct @ mentions
     * @param {object} options
     * @returns {Parser}
    */
    args(options) {
        /** @type {Parser} */
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