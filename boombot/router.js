import Discord from 'discord.io'
import logger from 'winston'
import Routes from "./commands/CommandRoutes"
import channels from "../bot/channels"

export default {

    router(context) {
        logger.info(`<${context.user}> ${context.message}`);

        const [cmd] = context.message.split(" ");
    
        if (Routes[cmd]) {
            const msg = Routes[cmd](context);
            context.bot.sendMessage({
                to: context.channelID,
                message: msg
            });
        }
    }

}