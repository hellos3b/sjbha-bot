import * as Command from '@sjbha/Command';

export const command = Command.filtered ({
  filter:   Command.Filter.startsWith ('!pong'),
  callback: message => message.reply ('Ping?')
});