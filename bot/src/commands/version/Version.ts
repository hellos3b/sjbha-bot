import * as Command from '@sjbha/Command';
import { env } from '@sjbha/app';

export const command = Command.filtered ({
  filter: Command.Filter.startsWith ('!version'),

  callback: message => message.channel.send (`BoredBot v${env.VERSION}`)
});
