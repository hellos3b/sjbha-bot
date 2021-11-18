import * as Fit from './commands/fit/register';
import * as Meetup from './commands/meetup/register';

export const loaders = [
  Fit.startup,
  Meetup.startup
]