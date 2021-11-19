import * as Command from './utils/Command';

import * as Aqi from './commands/aqi/register';
import * as Christmas from './commands/christmas/register';
import * as Fit from './commands/Fit/register';
import * as Meetup from './commands/meetup/register';
import * as Pong from './commands/pong/Pong';
import * as Subscribe from './commands/subscribe/register';
import * as Version from './commands/version/register';

export const run = Command.combine (
  Aqi.command,
  Christmas.command,
  Fit.command,
  Meetup.command,
  Pong.command,
  Subscribe.command,
  Version.command
)
