import { command } from "@sjbha/commands/pong/Pong";
import * as DiscordJs from "discord.js";
import { match, __ } from "ts-pattern";

type t = (message: DiscordJs.Message) => void;

export const make = (callback: t): t => callback;

export namespace Filter {
  export type t = (message: DiscordJs.Message) => boolean;

  export const and = (...filters: t[]) : t => {
    return message => filters.every(f => f(message));
  }

  /**
   * Filters for messages that start with a string.
   * You can pass in additional aliases
   */
  export const startsWith = (...instigators: string[]) : t => {
    return message => {
      const [first] = message.content.split (' ');

      return instigators.map (s => s.toLowerCase ())
        .includes (first.toLowerCase ());
    }
  }

  export const inChannel = (channelId: string, replyWith?: string) : t => {
    return message => {
      if (message.channel.id === channelId) {
        return true;
      }
      
      replyWith && message.channel.send(replyWith);
      return false;
    }
  }

  export const dmsOnly = () : t => {
    return message => message.channel.type === "DM";
  }

  export const equals = (str: string) : t => {
    return message => message.content === str;
  }

}

export const makeFiltered = (opt: {
  filter: Filter.t,
  callback: t
}) : t => {
  return message => opt.filter(message) && opt.callback(message);
}

export const combine = (...commands: t[]) : t => {
  return message => commands.forEach (command => command(message))
}

export const route = (message: DiscordJs.Message) : string | undefined => {
  const [_, route] = message.content
    .replace (/\n/g, ' ')
    .split (' ');

  return route;
}