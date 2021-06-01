export const code = (content: string, format = '') : string => ['```' + format, content, '```'].join ('\n');

export const inlineCode = (content: string) : string => '`' + content + '`';

export class MessageBuilder {
  private value: string[] = [];

  addLine = (content: string) : MessageBuilder => {
    this.value.push (content);

    return this;
  }

  addSpace = () : MessageBuilder => {
    this.value.push (' ');

    return this;
  }

  toString = () : string => this.value.join ('\n');

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

  output.addLine ('# ' + options.commandName);
  output.addLine ('  ' + options.description);
  output.addSpace ();

  output.addLine ('# Usage');
  output.addLine ('  ' + options.usage);

  if (options.commands) {
    const commands = options.commands;
    const keys = Object.keys (options.commands);
    const longestCmdLength = keys.reduce ((len, word) => word.length > len ? word.length : len, 0);
    const padEnd = longestCmdLength + 2;

    output.addSpace ();
    output.addLine ('# Commands');
    keys.forEach (k => {
      output.addLine ('  ' + k.padEnd (padEnd) + commands[k]);
    });
  }

  const preface = options.preface || '';

  return preface + output.toCode ('md');
}