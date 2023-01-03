import { DateTime } from "luxon";
import { match } from "ts-pattern";

type Stringable = number | string;

export const code = (content: Stringable, format = "") : string => ["```" + format, content, "```"].join ("\n");

export const inlineCode = (content: Stringable) : string => "`" + content + "`";

export const template = (content: string) => (filler: Record<string, number | string>) : string => 
   content.replace (/{([A-z]+)}/g, (match, idx) => (filler[idx]) ? filler[idx].toString () : match);

export enum TimeFormat { 
  Full = "Full", 
  Relative = "Relative"
}

/**
 * Formats a luxon date object into a timestamp format
 * that discord will parse in a cool way
 * 
 * @see https://discord.com/developers/docs/reference#message-formatting-formats
 */
export const time = (date: DateTime, style: TimeFormat) : string => {
   const seconds = Math.floor (date.toMillis () / 1000);
   const styleChar = match (style)
      .with (TimeFormat.Full, () => "F")
      .with (TimeFormat.Relative, () => "R")
      .exhaustive ();

   return `<t:${seconds}:${styleChar}>`;
};

export class MessageBuilder {
  private value = "";

  append = (content: string, filler: Record<string, string> = {}) : MessageBuilder => {
     this.value += template (content) (filler) + "\n";

     return this;
  }

  space = () : MessageBuilder => {
     this.value += "\n";

     return this;
  }

  beginCode = (format = "") : MessageBuilder => {
     this.value += "```" + format + "\n";

     return this;
  }

  endCode = () : MessageBuilder => {
     this.value += "```\n";

     return this;
  }

  toString = () : string => this.value;

  toCode = (format = "") : string => code (this.toString (), format);
}

export type HelpOptions = {
  preface?: string;
  commandName: string;
  description: string;
  usage: string
  commands?: {
    [key: string]: string
  }
  sections?: {
    title: string;
    commands: Record<string, string>;
  }[];
}

export const Section = (title: string, commands: Record<string, string>) : string => {
   const keys = Object.keys (commands);
   const longestCmdLength = keys.reduce ((len, word) => word.length > len ? word.length : len, 0);
   const padEnd = longestCmdLength + 2;

   const section = new MessageBuilder ();
   section.append (`# ${title}`);

   keys.forEach (k => {
      section.append ("  " + k.padEnd (padEnd) + commands[k]);
   });

   return section.toString ();
};

export const help = (options: HelpOptions) : string => {
   const output = new MessageBuilder ();

   output.append ("# " + options.commandName);
   output.append ("  " + options.description);
   output.space ();

   output.append ("# Usage");
   output.append ("  " + options.usage);

   if (options.commands) {
      const commands = Section ("Commands", options.commands);
      output.space ();
      output.append (commands.toString ());
   }

   options.sections && options.sections.forEach (section => {
      const sect = Section (section.title, section.commands);
      output.space ();
      output.append (sect.toString ());
   });

   const preface = options.preface || "";

   return preface + output.toCode ("md");
};