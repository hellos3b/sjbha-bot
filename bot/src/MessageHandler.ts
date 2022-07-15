import * as Discord from "discord.js";

export type HandlerCallback = (...messages: string[]) => (message: Discord.Message) => unknown;

export type HandlerConfig = {
  regex: RegExp;
  callback: HandlerCallback
}

export class MessageHandler {
  private handlers: HandlerConfig[] = [];

  when = (match: RegExp, callback: HandlerCallback): MessageHandler => {
    this.handlers.push({ regex: match, callback });
    return this;
  };

  handle = (message: Discord.Message) => {
    for (const handler of this.handlers) {
      const result = message.content.match(handler.regex);

      if (result) {
        const [_, ...groups] = result;
        handler.callback(...groups)(message);
        return;
      }
    }
  }
}