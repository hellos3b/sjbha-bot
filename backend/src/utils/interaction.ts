import { Instance, Message$ } from '@sjbha/app';
import { Message } from 'discord.js';
import { Option, option } from 'ts-option';
import { MessageBuilder } from './string-formatting';

/**
 * @deprecated 
 * For Interactions API, use discord.js' message collector instead
 * ```ts
    const interaction = message.channel.createMessageCollector (m => m.author.id === message.author.id);
    const meetup = await interaction.next.then (meetupPicker.get);
  ```

  For building a prompt, use the `multi-choice` module instead
 */
export namespace InteractionLegacy {
  export type MapMessage<T> = (message: Message) => T;

  class Capture<T> {
    private mapFn : MapMessage<T>;

    private filterFn : MapMessage<boolean> = _ => true;

    private timeout_ms  = 5 * 60 * 1000;

    private timeoutFn : () => void = () => { /** Ah Well! */ };

    constructor (mapfn: MapMessage<T>) {
      this.mapFn = mapfn;
    }

    /**
     * Set a filter to ignore specific messages, either by channel, author, or some other criteria
     * 
     * @param f Listen to messages and return either true or false 
     * @returns this
     */
    filter = (f: MapMessage<boolean>) : Capture<T> => {
      const current = this.filterFn;
      this.filterFn = message => f (message) && current (message);

      return this;
    }

    /**
     * Filter the interaction to a specific channel ID. Can filter for multiple channel IDs
     * 
     * @param channelId The channel ID you want to listen to
     * @returns this
     */
    in = (...channelIds: string[]) : Capture<T> => 
      this.filter (message => channelIds.includes (message.channel.id));

    /**
     * Filters and only captures messages from specific user(s)
     * 
     * @param discordIds The users you're interested in capturing from
     * @returns this
     */
    from = (...discordIds: string[]) : Capture<T> => 
      this.filter (message => discordIds.includes (message.author.id));

    /**
     * If interacting in response to a command, this shorthand is good for filtering based on the incoming message. 
     * Will only capture messages from the same author in the same channel
     * 
     * @param message The incoming message
     * @returns this
     */
    inReplyTo = (message: Message) : Capture<T> => 
      this.from (message.author.id).in (message.channel.id);

    /**
     * Will get called if the user leaves the interaction hanging. Works well for notifying the user that they ran out of time
     * 
     * @param f The callback to call on timeout
     * @returns this
     */
    onTimeout = (f: () => void) : Capture<T> => {
      this.timeoutFn = f;

      return this;
    }

    setTimeout = (ms: number) : Capture<T> => {
      this.timeout_ms = ms;

      return this;
    }
    
    /**
     * Triggers the interaction, promise resolves once a filter passes through.
     * Resolves a promise with whatever value the capture returns
     * 
     * ```ts
     * Interaction
     *  .capture(message => message.content === 'Y')
     *  .get()
     *  .then (result => { }) // result === true | false
     * ```
     * 
     * @returns A promise that resolves with the interaction capture
     */
    get = () : Promise<T> => new Promise ((resolve) => {
      let unsubscribe = () => { /** */ };

      unsubscribe = Message$
        .filterElse (message => message.content.toLowerCase () === 'cancel', unsubscribe)
        .filter (this.filterFn)
        .subscribe (message => {
          unsubscribe ();
          clearTimeout (tookTooLong);
          
          resolve (this.mapFn (message));
        });

      const tookTooLong = setTimeout (() => {
        unsubscribe ();
        this.timeoutFn ();
      }, this.timeout_ms);
    });
  }

  /**
   * Initiate a new Interaction with a capture of T
   * 
   * A capture is just a map function that transforms an in coming message to `T` value.
   * 
   * ```ts
   * Interaction.capture(message => message.content === 'Y')
   * ```
   * 
   * 
   * @param mapfn 
   * @returns Interaction of type T
   */
  export function capture(): Capture<string>;
  export function capture<T>(mapfn: MapMessage<T>): Capture<T>;
  export function capture<T>(mapfn?: MapMessage<T>) : Capture<T> | Capture<string> {
    return (mapfn)
      ? new Capture<T> (mapfn)
      : new Capture<string> (msg => msg.content);
  }

  /**
  * Shorthand for creating a capture that returns `true` when the message is a 'Y', otherwise false
  * 
  * @returns An interaction for capturing a yes/no value
  */
  export const confirm = () : Capture<boolean> => 
    new Capture (message => ['yes', 'y'].includes (message.content.toLowerCase ()));

  type Choice<T> = {
    name: string;
    value: T;
  };

  /**
  * Creates an interaction where the user picks from a list of numbered option.
  * 
  * Meant to be used with `Interaction.OptionBuilder` to create the list
  * 
  * ```ts
  * const options = new Interaction
  *   .OptionBuilder <string> ('Pick a name')
  *   .addOption ('Seb', 'Seb')
  *   .addOption ('Jenn', 'Jenn');
  * 
  * await message.channel.send (options.toString());
  * 
  * const result = await options.interact().wait();
  * ```
  */
  export class OptionBuilder<T> {
    private readonly question: string;

    private options: Choice<T>[] = [];

    constructor (question = '') {
      this.question = question;
    }

    addOption = (name: string, value: T) : OptionBuilder<T> => {
      this.options.push ({ name, value });

      return this;
    }

    get = (index: number | string) : Option<T> => {
      const choice = (typeof index === 'string') ? parseInt (index) : index;

      return option (this.options[choice]).map (o => o.value);
    }

    toString = () : string => {
      const msg = new MessageBuilder ();

      this.question && msg.append (this.question);

      msg.beginCode ();
      this.options.forEach (
        ({ name }, i) => msg.append (`${i}: ${name}`)
      );
      msg.endCode ();

      msg.append ('Or reply \'cancel\' to exit');

      return msg.toString ();
    }

    askIn = (channelId: string) : Promise<Message> => 
      Instance.fetchChannel (channelId)
        .then (channel => channel.send (this.toString ()));

    capture = () : Capture<T | null> => 
      new Capture (message => this.get (message.content).orNull);
  }
}