import chalk from 'chalk'

export default function(name) {
    return {
        log(message, data) {
            console.log(
                "   ",
                chalk.blue(`[${name}]`),
                chalk.gray(message),
                data || ""
            )
            return message
        }
    }
}