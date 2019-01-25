import deepmerge from 'deepmerge'
import chalk from 'chalk'

const baseConfig = {
  restrict: [],
  channel: "416525963464146944"
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const cmd = bastion.command(config.command)
    const log = bastion.Logger("Poll").log


    const AddThumb = async (channelID, msgId) => {
      await bastion.bot.addReaction({
          channelID: channelID,
          messageID: msgId,
          reaction: '👍'
      })

      bastion.bot.addReaction({
          channelID: channelID,
          messageID: msgId,
          reaction: '👎'
      })
    }

    bastion.on('message', context => {
      if (context.channelID !== config.channel) return;
      
      if (
        context.message.includes("youtube.com") || 
        context.message.includes("youtu.be") ||
        context.message.includes("soundcloud.com")
      ) {
        AddThumb(context.channelID, context.evt.d.id)
      }
    })

    return []
}