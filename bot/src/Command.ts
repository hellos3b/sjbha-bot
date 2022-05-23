import type * as DiscordJs from 'discord.js';
import { __ } from 'ts-pattern';
import * as Filter from "./CommandFilter";

type command = (message: DiscordJs.Message) => void;

export type t = command;

export type filter = (message: DiscordJs.Message) => boolean;


export const make = (callback: command): command => callback;

export function filtered(opt: {
  filter?: filter;
  filters?: filter[];
  callback: command;
}): command {
  return message => {
    const filters = Filter.and(
      opt.filter ?? (() => true),
      ...(opt.filters ?? [])
    );

    if (filters(message))
      opt.callback(message)
  };
}

export function combine(...commands: command[]): command {
  return message => commands.forEach(command => command(message));
}

export function route(message: DiscordJs.Message): string | undefined {
  const [_, route] = message.content
    .replace(/\n/g, ' ')
    .split(' ');

  return route;
}

// Back compatibility
export { Filter }