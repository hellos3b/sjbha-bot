import * as DiscordJs from 'discord.js';
import { __ } from 'ts-pattern';

type command = (message: DiscordJs.Message) => void;

export const make = (callback: command): command => callback;

export namespace Filter {
  export type filter = (message: DiscordJs.Message) => boolean;

  export const and = (...filters: filter[]) : filter => message => 
    filters.every (f => f (message))

  export const or = (...filters: filter[]) : filter => message =>
    filters.some (f => f (message));

  /**
   * Filters for messages that start with a string.
   * You can pass in additional aliases
   */
  export const startsWith = (...instigators: string[]) : filter => message => {
      const [first] = message.content.split (' ');

      return instigators.map (s => s.toLowerCase ())
        .includes (first.toLowerCase ());
    }

  export const inChannel = (channelId: string, replyWith?: string) : filter => message => {
      if (message.channel.id === channelId) {
        return true;
      }
      
      replyWith && message.channel.send (replyWith);
      return false;
    }

  export const dmsOnly = () : filter => message => message.channel.type === 'DM'

  export const equals = (str: string) : filter => message => message.content === str

}

export const makeFiltered = (opt: {
  filter: Filter.filter,
  callback: command
}) : command => message => opt.filter (message) && opt.callback (message)

export const combine = (...commands: command[]) : command => message => commands.forEach (command => command (message))

export const route = (message: DiscordJs.Message) : string | undefined => {
  const [_, route] = message.content
    .replace (/\n/g, ' ')
    .split (' ');

  return route;
}