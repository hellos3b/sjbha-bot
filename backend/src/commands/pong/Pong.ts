import * as Command from '@sjbha/utils/Command';

export const command = Command.makeFiltered ({
  filter: Command.Filter.startsWith("!pong"),
  callback: message => message.reply("Pong!")
});