export const code = (content: string, format = '') : string => ['```' + format, content, '```'].join ('\n');

export const inlineCode = (content: string) : string => '`' + content + '`';

export class MessageBuilder {
  private value = '';

  append = (content: string) : MessageBuilder => {
    this.value += content + '\n';

    return this;
  }

  space = () : MessageBuilder => {
    this.value += '\n';

    return this;
  }

  beginCode = (format = '') : MessageBuilder => {
    this.value += '\n```' + format + '\n';

    return this;
  }

  endCode = () : MessageBuilder => {
    this.value += '\n```\n';

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