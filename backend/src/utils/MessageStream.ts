import { channels } from '@sjbha/config';
import { Message } from 'discord.js';

type Listener<T> = (value: T) => void;
type Unsubscribe = () => void;

export class Stream<T> {
  protected listeners = new Set<Listener<T>> ();

  subscribe (fn: Listener<T>) : Unsubscribe {
    this.listeners.add (fn);

    return () => this.listeners.delete (fn);
  }


  /**
   * Filter the message, if the filter fails then the pipe ends
   * and the ending `subscribe` won't be called
   * 
   * @param fn 
   */
   filter (fn: (value: T) => boolean) : Stream<T> {
    const filtered = new WritableStream<T> ();
    this.subscribe (val => fn (val) && filtered.emit (val));

    return filtered;
  }

  /**
   * Changes the value of `T` to a new value
   * 
   * @param fn 
   * @returns 
   */
  map <U>(fn: (value: T) => U) : Stream<U> {
    const obs = new WritableStream<U> ();
    this.subscribe (val => obs.emit (fn (val)));

    return obs;
  }
}

export class MessageStream extends Stream<Message> {
  protected listeners = new Set<Listener<Message>> ();

  /**
   * Replies to the message with the content of the string
   * 
   * @param content
   * @returns 
   */
  replyWith (content: string) : Unsubscribe {
    return this.subscribe (message => message.channel.send (content));
  }

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
   routes (routes: Record<'noMatch' | 'empty' | '*' | string, Listener<Message>>) : Unsubscribe {
    return this.subscribe (message => {
      const [_, route] = message.content
        .replace (/\n/g, ' ')
        .split (' ');

      switch (true) {
        case (route in routes):
          routes[route] (message);
          break;

        case (route.length && ('noMatch' in routes)):
          routes.noMatch (message);
          break;

        case (!route && ('empty' in routes.empty)):
          routes.empty (message);
          break;

        case ('*' in routes):
          routes['*'] (message);
          break;
      }
    });
  }

  /**
   * Filter the message, if the filter fails then the pipe ends
   * and the ending `subscribe` won't be called
   * 
   * @param fn 
   */
  filter (fn: (message: Message) => boolean) : MessageStream {
    const filtered = new WritableMessageStream ();
    this.subscribe (val => fn (val) && filtered.emit (val));

    return filtered;
  }

  /**
   * Filter the message, if the filter fails then the pipe ends and `ifFalse` gets called.
   * 
   * Same thing as filter but lets you specify an action before breaking
   * 
   * @param fn 
   */
  filterElse (fn: (message: Message) => boolean, ifFalse: (message: Message) => void) : MessageStream {
    const filtered = new WritableMessageStream ();
    this.subscribe (val => {
      if (fn (val)) {
        filtered.emit (val);
      }
      else {
        ifFalse (val);
      }
    });

    return filtered;
  }

  /**
   * Filters for messages that start with a string.
   * You can pass in additional aliases
   * 
   * @example
   * ```ts
   * listener.startsWith("!ping", "!p");
   * ```
   */
  startsWith (...instigators: string[]) : MessageStream {
    return this.filter (message => {
      const [first] = message.content.split (' ');

      return instigators.map (s => s.toLowerCase ())
        .includes (first.toLowerCase ());
    })
  }

  /**
   * Direct match for message content, checks if `message.toLowerCase() === message`
   * 
   * @param message 
   * @returns 
   */
  equals (message: string) : MessageStream {
    return this.filter (msg => msg.content.toLowerCase () === message.toLowerCase ());
  }

  /**
   * 
   * @param channelIds 
   * @param replyWith 
   * @returns 
   */
  restrictToChannel (channelIds: string | string[], replyWith?: string) : MessageStream {
    const ids = (typeof channelIds === 'string')
      ? [channelIds]
      : channelIds;

    return this.filter (message => {
      const passes = ids.includes (message.channel.id);

      if (!passes && replyWith) {
        message.reply (replyWith);
      }

      return passes;
    });
  }

  /**
   * Admin command only, restricts to the bot admin channel
   * 
   * @returns 
   */
  adminOnly () : MessageStream {
    return this.restrictToChannel (channels.bot_admin);
  }

  /**
   * Restricted to DMs, useful for noisy config style stuff
   * 
   * @returns 
   */
  dmsOnly () : MessageStream {
    return this.filter (message => message.channel.type === 'dm');
  }
}

export class WritableStream<T> extends Stream<T> {
  emit (value: T) : void {
    this.listeners.forEach (l => l (value));
  }

  get readonly () : Stream<T> {
    return this;
  }
}

export class WritableMessageStream extends MessageStream {
  emit (message: Message) : void {
    this.listeners.forEach (l => l (message));
  }

  get readonly () : MessageStream {
    return this;
  }
}