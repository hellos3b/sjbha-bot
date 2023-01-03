import { Message } from "discord.js";
import { MessageBuilder } from "../deprecating/Format";

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

  get = (index: number | string) : T | null => {
     const choice = (typeof index === "string") ? parseInt (index) : index;
     return this.choices[choice]?.value ?? null;
  }

  parse = (message: Message) : T | null => 
     (message.content === "cancel")
        ? null
        : this.get (message.content)

  toString() : string {
     const msg = new MessageBuilder ();

     this.prompt && msg.append (this.prompt);

     msg.beginCode ();
     this.choices.forEach (
        ({ label }, i) => msg.append (`${i}: ${label}`)
     );
     msg.endCode ();

     msg.append ("Or reply 'cancel' to exit");

     return msg.toString ();
  }

  static create <T>(prompt: string, choices: Choice<T>[]) : MultiChoice<T> {
     return new MultiChoice (prompt, choices);
  }

  static opt <T>(label: string, value: T) : Choice<T> {
     return { label, value };
  }
}