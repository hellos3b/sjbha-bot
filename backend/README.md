# Commands

## Creating a Command

To add a new command, you need to do two things

1. In the `src/commands` folder, create a new folder named after the command you plan on adding ("!meetup" would be in `commands/meetup`). Then create a new file named `register.ts` that will be used to define the shape of your command, here's a starter:

```ts
import { Message$ } from '@sjbha/app';

Message$
  .startsWith ('!hello')
  .replyWith ('Hello World!');
```

2. Import your command to `src/main.ts`. Just add an import statement to the path of your register file

```ts
import "./commands/hello/register.ts"
```

You now have your first command!

## The MessageStream

Commands are created by subscribing to the MessageStream, which is a custom slim stream implementation in a similar vein of RxJs. The stream emits [Discord.js Message](https://discord.js.org/#/docs/main/stable/class/Message) objects and provides a few commonly used helper methods for filtering

The root Message stream is exposed via `Message$` in `@sjbha/app`.  Stream provides a `filter` and a `subscribe` function, where filter is used to stop the stream and subscribe is used to finish it

```ts
import { Message$ } from '@sjbha/app';

Message$
  .filter (msg => msg.content === '!ping')
  .subscribe(msg => msg.reply("pong!"));
```

All the helper methods are documented ~~here~~ (TODO), or browse the file directly

## Command Style Guide

In an effort to make these files easy to browse, I've adopted this pattern to keep consistency. 

Every different command should have it's own folder located under `commands/\<command-name>/`.

📝 **register.ts** - Every command should have a register file that they use to define the command name

📝 **\<command-name>.ts** - The logic of the command, named after the folder

📁 **commands/** - If there's multiple commands (!meetup edit vs !meetup create), these commands should go a folder named `commands`, and the file should be named after the route (commands/edit, commands/create)

📁 **admin/** - When the command has configuration options meant to be used by admins, these commands go into a separate folder called admin

📁 **db/** - If the command needs to store stuff, create a file for each collection in the db folder

📁 **common/** - Sometimes, different sub commands might need to rely on the same model or parsing utility. These should go into the common folder

📁 **routes/** - If the command has a web UI and needs to expose an API, put each endpoint into a separate file named after what it's for

📁 **features/** - Instance based 'commands', for importing the bot singleton to post something (i.e. based on a timer like duckhunt, or posting activity from an API endpoint like strava or reddit) then it should go into the features folder