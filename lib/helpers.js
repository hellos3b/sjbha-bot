export default {

    code(str, style) {
        const start = (style) ? "```"+style+"\n" : "```"
        return start + str + "```"
    },

    mentionID(str) {
        return str.replace("<@!","").replace("<@","").replace(">","")
    },

    toMention(id) {
        return `<@!${id}>`
    }

}