export const code = (content: string, format = '') : string => ['```' + format, content, '```'].join ('\n');

export const inlineCode = (content: string) : string => '`' + content + '`';

export const template = (content: string) => (filler: Record<string, number | string>) : string => 
  content.replace (/{([A-z]+)}/g, (match, idx) => (filler[idx]) ? filler[idx].toString () : match);

export class MessageBuilder {
  private value = '';

  append = (content: string, filler: Record<string, string> = {}) : MessageBuilder => {
    this.value += template (content) (filler) + '\n';

    return this;
  }

  space = () : MessageBuilder => {
    this.value += '\n';

    return this;
  }

  beginCode = (format = '') : MessageBuilder => {
    this.value += '```' + format + '\n';

    return this;
  }

  endCode = () : MessageBuilder => {
    this.value += '```\n';

    return this;
  }

  toString = () : string => this.value;

  toCode = (format = '') : string => code (this.toString (), format);
}

export type HelpOptions = {
  preface?: string;
  commandName: string;
  description: string;
  usage: string
  commands?: {
    [key: string]: string
  }
}

export const help = (options: HelpOptions) : string => {
  const output = new MessageBuilder ();

  output.append ('# ' + options.commandName);
  output.append ('  ' + options.description);
  output.space ();

  output.append ('# Usage');
  output.append ('  ' + options.usage);

  if (options.commands) {
    const commands = options.commands;
    const keys = Object.keys (options.commands);
    const longestCmdLength = keys.reduce ((len, word) => word.length > len ? word.length : len, 0);
    const padEnd = longestCmdLength + 2;

    output.space ();
    output.append ('# Commands');
    keys.forEach (k => {
      output.append ('  ' + k.padEnd (padEnd) + commands[k]);
    });
  }

  const preface = options.preface || '';

  return preface + output.toCode ('md');
}