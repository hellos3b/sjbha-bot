# Bot for SJBHA

> :warning: This version of bored bot is legacy and deprecated. This branch is here for backwards support until all the commands are migrated to the master branch

## Setup

Setup is simple, make sure you have npm installed. Just clone the repo and install dependencies

```bash
git clone https://repo.git
cd sjbha-bot
npm install
```

In order to run the bot, you will need to create a `.env` file in the root directory, and then run

```bash
npm run dev
```

note: run commands via `_help` instead of `!help`. Change the symbol by adding the '--symbol=' switch after 'npm run dev'

Hit up @s3b if you want access to the dev server. Will provide you a .env file with the dev keys

# Folders

- `config/` - Holds a webpack-inspired config where plugins are imported, and any plugins are initiated with their options
- `lib/` - The Bastion library, a thing I built on top of the [discord.io](https://github.com/izy521/discord.io) to make things more opinionated/structured
- `plugins/` - Subdirectories split by commands, this is where you want to be

# First Plugin

Going to walk through making a simple calculator app

### 1. Create a `Calculator` folder in `plugins/`

### 2. Create a `index.js` file

The `index.js` file expects a function that returns an array of JSON. First argument of the function should be `bastion`, which is a reference to the lib. Normally, we'd also take in a second `opt` parameter so the plugin can be configed from `plugins.config.js`

```js
export default function(bastion, opt={}) {
  return []
}
```

### 3. Define a command

A command follows a simple structure (see PluginResolver below)

We're going to create a command that adds two numbers

```js
return [{
  command: 'add',
  resolve(context, msg) {
    const [a, b] = msg.split(" ")
    return parseInt(a) + parseInt(b)
  }
}]
```

If you just return a value, the bot will just reply with that to the channel id

### 4. Validate

This will throw an error if someone just typed `!add 5`. There's an option that lets you pre-validate things

```js
return [{
  command: 'add',
  validate(context, msg) {
    if (msg.split(" ").length < 2) return 'Need two numbers to add'
    const [a, b] = msg.split(" ")
    if (isNaN(parseInt(a)) || isNaN(parseInt(b))) return 'Those are not valid numbers'
  }
  resolve(context, msg) {
    const [a, b] = msg.split(" ")
    return parseInt(a) + parseInt(b)
  }
}]
```

If you return a string, the bot will reply the error message. If no return, it will continue on to `resolve()`

### 5. Add your plugin to the config

Head over to `plugins.config.js` and import your module 

```js
// ....
import Calculator from '../plugins/Calculator'

// ....

export default bastion => ([
  // ... other plugins
  Calculator
])
```

Bastion will figure out if it needs to pass in it's own reference or not, so no need to explicitely do it

### 6. Restart the bot

CTRL+C and hit `npm run dev` again -- there's no file watcher, so you have to restart it after each change

# Plugin

`Plugin` is the json that each plugin uses. Here are the options and helpers it provides

```ts
interface Plugin {
  /** Restrict this route to these channels [channelID] */
  restrict?: string[];
  /** If command is restricted, bot will autoreply this message if used outside of restricted channels */
  restrictMessage?: string;
  /** Ignore these channels [channelID] */
  ignore?: string[];
  /** Throw an error if dependency is not setup in config */
  requires?: string[];
  /** The command to use for this plugin to be called. Will run when !{command} is called */
  command?: string;
  /** An action is a subset of a command, can be called by doing this.route(action) */
  action?: string;
  /** Automatically reply with a help string if `!{command} help` is called */
  help?: string;
  /** Send help string if !command is called with no argument. Default false */
  helpOnEmpty?: boolean;
  /** Takes incoming context, and parses the context. Result of this function gets passed in as the second argument of any Resolver */
  options?: Parser;
  /** Syntax way to run some validates before passing data to resolve(). If a string is returned, the bot will send that as a message and skip resolve() */
  validate?: Resolver;
  /** Main router for the command. If string is returned, will reply with just that */
  resolve: string|Resolver;
  /** Container for command-specific methods. Gets mapped to `this` inside of validate() and resolve() */
  methods?: {
    [key: string]: Function
  };
}
```

# Actions

// todo

# Type Checking

Type checking is a WIP and kinda new, but it may help you working in a plugin. If using VSCode, it will help you with auto completion, intellisense and validating your arguments

To enable it for your plugin, add this above your imports

```js
/** @typedef {import('@/types').PluginResolver} PluginResolver */
```

And above your export function, set the type as PluginResolver
```js
/** @type {PluginResolver} */
export default function(bastion, opt={}) {
```