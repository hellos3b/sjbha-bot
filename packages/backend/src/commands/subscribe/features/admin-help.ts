import { MessageHandler } from '@sjbha/app';

export const adminHelp : MessageHandler = async message => message.channel.send (`
Admin Subscribe Usage:
  \`$subscribe add @role\` To add a new subscribe
  \`$subscribe remove {rolename}\` To add a remove a subscription
`)