import * as Discord from 'discord.js';

// Commands that have been migrated to use a `/command` instead of a `!command`
// we'll let 
const slashified = [
  'pong',
  'tldr',
  'version'
]

// Just prints out a standard warning that a command was moved
export const warn = (message: Discord.Message): void => {
  const result = message.content.match (/!(\w*[^\s])/);
  if (!result)
    return;

  const [, command] = result;

  if (slashified.includes (command)) {
    message.reply (`The '${command}' command has been turned into a slash command, check out by using \`/${command}\`!`);
  }
}