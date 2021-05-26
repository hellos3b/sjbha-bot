import { Handler, channels, onMessageEvent } from '@sjbha/app';
import type { Message } from 'discord.js';

export type NextFn = () => void;
export type MessageMiddleware = (message: Message, next: NextFn) => void;

/**
 * Compose a series middleware together to create a command.
 * 
 * Middleware is used as helpers for filtering and routing an incoming message.
 * 
 * ```ts
 * command (
 *   startsWith ("!ping"),
 *   reply ("Pong!")
 * )
 * ```
 * 
 * @param run 
 * @param middlewares 
 * @returns A Handler that can be passed to `onMessageEvent`
 */
export const command = (...middlewares: MessageMiddleware[]) : Handler => {
  if (!middlewares.length) {
    return _ => { /** Ignore */ }
  }

  const [run, ...tail] = middlewares;
  const next = command (...tail);

  return message => run (message, () => next (message));
}

/**
 * Creates a command and auto registers it with the bot.
 * 
 * Shorthand for `onMessageEvent (command (...))`
 */
export const registerCommand = (...middleware: MessageMiddleware[]) : void => {
  onMessageEvent (command (...middleware));
}

/**
 * Filters for messages that start with a string.
 * You can pass in additional aliases
 * 
 * ```ts
 * startsWith("!ping", "!p");
 * ```
 */
export const startsWith = (...instigator: string[]) : MessageMiddleware =>
  (message, next) => {
    const [command] = message.content.split (' ');
    const matches = instigator.map (s => s.toLowerCase ());

    if (matches.includes (command.toLowerCase ())) {
      next ();
    }
  };

/**
 * Routes to different handlers based on the second word of a command where:
 * 
 * `{!command} {route} {...message}`
 * 
 * You can also use `default` to handle no match and `__` to handle missing route
 * 
 * ```ts
 * routes ({
 *   "add"    : addHandler,     // !cmd add
 *   "remove" : removeHandler,  // !cmd remove
 *   default  : defaultHandler, // !cmd nomatch
 *   __       : emptyHandler    // !cmd
 * })
 * ```
 * 
 * @param routes 
 * @returns 
 */
export const routes = (routes: Record<string, Handler>) : MessageMiddleware =>
  message => {
    const [, secondWord] = message.content.split (' ');

    // Missing param / empty command
    if (!secondWord) {
      if (routes.__) {
        routes.__ (message);
      }

      return;
    }

    // If the route exists
    const handler = (routes[secondWord])
      ? routes[secondWord]
      : routes.default;
      
    if (handler) {
      handler (message);
    }
  }

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

// Specific Helpers

/**
 * Replies directly with a string message
 * 
 */
export const reply = (content: string) : MessageMiddleware =>
  message => message.channel.send (content);

/**
 * Scopes a handler to the #bot-admin channel
 * 
 * ```ts
 * registerHandler (admin (message => {
 *    message.channel.send("Admin only command!");
 * }))
 * ```
 */
export const admin = (handler: Handler) : Handler => command (restrictToChannel (channels.bot_admin), handler);
