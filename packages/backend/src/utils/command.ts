import type { Handler } from "@sjbha/app";
import type { Message } from "discord.js";

export type NextFn = () => void;
export type MessageMiddleware = (message: Message, next: NextFn) => void;

export const command = (run: MessageMiddleware, ...middlewares: MessageMiddleware[]) : Handler => {
  return (message: Message) => {
    if (middlewares.length) {
      const [head, ...tail] = middlewares;
      const next = command (head, ...tail);

      run (message, () => next (message));
    }
    else {
      run (message, () => {})
    }
  }
}

export const reply = (content: string) : MessageMiddleware =>
  message => message.channel.send (content);

export const startsWith = (instigator: string) : MessageMiddleware =>
  (message, next) => {
    if (message.content.toLowerCase().startsWith (instigator.toLowerCase())) {
      next();
    }
  };

export const restrictToChannel = (channelIds: string | string[], replyWith?: string) : MessageMiddleware =>
  (message, next) => {
    const ids = (typeof channelIds === 'string')
      ? [channelIds]
      : channelIds;

    if (ids.includes (message.channel.id)) {
      next ();
    }
    else if (replyWith) {
      message.channel.send (replyWith);
    }
  }