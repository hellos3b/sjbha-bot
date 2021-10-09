import { Message } from 'discord.js';
import { option, Option } from 'ts-option';
import { MessageBuilder } from './string-formatting';

export type Choice<T> = {
  readonly label: string;
  readonly value: T;
}

export default class MultiChoice<T> {
  private readonly prompt: string;

  private readonly choices: Choice<T>[];

  constructor (prompt: string, choices: Choice<T>[]) {
    this.prompt = prompt;
    this.choices = choices;
  }

  get = (index: number | string) : Option<T> => {
    const choice = (typeof index === 'string') ? parseInt (index) : index;

    return option (this.choices[choice]).map (o => o.value);
  }

  parse = (message: Message) : T | null => 
    (message.content === 'cancel')
      ? null
      : this.get (message.content).orNull

  toString() : string {
    const msg = new MessageBuilder ();

    this.prompt && msg.append (this.prompt);

    msg.beginCode ();
    this.choices.forEach (
      ({ label }, i) => msg.append (`${i}: ${label}`)
    );
    msg.endCode ();

    msg.append ('Or reply \'cancel\' to exit');

    return msg.toString ();
  }

  static create <T>(prompt: string, choices: Choice<T>[]) : MultiChoice<T> {
    return new MultiChoice (prompt, choices);
  }

  static opt <T>(label: string, value: T) : Choice<T> {
    return { label, value };
  }
}