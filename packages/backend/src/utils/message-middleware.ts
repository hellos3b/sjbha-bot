import { MessageHandler, MessageMiddleware, channels } from '@sjbha/app';

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
 * Routes to different handlers based on the second word of a command where 'route' is the second word passed in
 * 
 * `{!command} {route} {...message}`
 * 
 * There are also two specialty 'reserved' routes you can use:
 * 
 * 1. `noMatch` - if they used a route but that route doesn't exist
 * 2. `empty`   - if they used the command standalone without a route
 * 3. `'*'`     - catch all case if no route was matched
 * 
 */
export const routes = (routes: Record<'noMatch' | 'empty' | '*' | string, MessageHandler>) : MessageHandler =>
  message => {
    const [, route] = message.content.split (' ');

    if (route) {
      if (routes[route]) {
        routes[route] (message);

        return;
      }
      else if (routes.noMatch) {
        routes.noMatch (message);

        return;
      }
    }
    else if (routes.empty) {
      routes.empty (message);

      return;
    }

    // If no matches, go to next middleware
    if (routes['*']) {
      routes['*'] (message);
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
export const reply = (content: string) : MessageHandler =>
  message => message.channel.send (content);

/**
 * Restricts a command to the admin channel
 */
export const adminOnly = () : MessageMiddleware => 
  (message, next) => {
    if (message.channel.id === channels.bot_admin) {
      next ();
    }
  };