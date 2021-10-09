import moduleAlias from 'module-alias';
moduleAlias.addAlias ('@sjbha', __dirname);

// Default time zone
import { Settings } from 'luxon';
Settings.defaultZoneName = 'America/Los_Angeles';

// COMMANDS
import './commands/aqi/register';
import './commands/christmas/register';
import './commands/fit/register';
import './commands/meetup/register';
import './commands/pong/register';
import './commands/subscribe/register';
import './commands/version/register';