import Discord from 'discord.io'
import logger from 'winston'
import Routes from "./commands/CommandRoutes"
import channels from "../bot/channels"

export default {

    router: async function(context) {
        logger.info(`<${context.user}> ${context.message}`);

        const [cmd] = context.message.split(" ");
    
        if (Routes[cmd]) {
            const msg = await Routes[cmd](context);
            logger.debug("Got message - ", msg);

            if (msg) {
                logger.info("MSG ", msg);
                await context.bot.sendMessage({
                    to: context.channelID,
                    message: msg
                });
            }
        }
    }

}