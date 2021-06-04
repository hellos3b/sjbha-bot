import 'module-alias/register';

// Default time zone
import { Settings } from 'luxon';
Settings.defaultZoneName = 'America/Los_Angeles';

// COMMANDS
import './commands/capture/register';
import './commands/aqi/register';
import './commands/christmas/register';
import './commands/fit/register';
import './commands/pong/register';
import './commands/subscribe/register';