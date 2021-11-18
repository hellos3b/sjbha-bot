import * as Command from '@sjbha/utils/Command';
import { env } from '@sjbha/app';

export const command = Command.makeFiltered ({
  filter: Command.Filter.startsWith ('!version'),

  callback: message => message.channel.send (`BoredBot v${env.VERSION}`)
});
