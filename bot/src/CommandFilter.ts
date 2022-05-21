import * as DiscordJs from 'discord.js';

type filter = (message: DiscordJs.Message) => boolean;

export type t = filter;

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