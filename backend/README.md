## Command Style Guide

Here's a style guide being followed that can help you navigate the folders

## Folder Structure

### Each Command has it's own folder

The folder should be named after the command name so it's easy to find

### `register.ts` - Hook into the bot

The register.ts should just define the command with the bot and set up the filters (like admin only, specific channel, etc)

### `[command].ts` - Command Logic

Simple commands should have a  .ts file that matches the name of the folder

### `commands/` - Sub Commands

If there's multiple commands (!meetup edit vs !meetup create), these commands should go a folder named `commands`, and the file should be named after the route

ex: **!meetup edit** would go into `commands/edit.ts`

### `db/` - Database Models

The commands uses the base mongo driver, and each collection should have it's own file under the db folder

### `common/` - Reusable Utilities

Sometimes, different sub commands might need to rely on the same model or parsing utility. These should go into the common folder

### `routes/` - Web APIs

If the command has a web UI and needs to expose an API, put each endpoint into a separate file named after what it's for

### `features/` - Instance based 'commands'

For importing the bot singleton to post something (i.e. based on a timer like duckhunt, or posting activity from an API endpoint like strava or reddit) then it should go into the features folder

### `admin/` - Admin-only Commands

When the command has configuration options meant to be used by admins, these commands go into a separate folder called admin