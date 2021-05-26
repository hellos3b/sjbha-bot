import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { flow, pipe } from "fp-ts/function";

import * as RX from "rxjs/operators";
import * as C from "./Channel";

import * as Discord from "discord.js";
import minimist from "minimist";

import {InvalidArgsError} from "@packages/common-errors";

/**
 * This message was sent in the server
 */
export type ChannelMessage = Discord.Message & {
  __tag: "channel";
  channel: Discord.TextChannel;
  member: Discord.GuildMember;
  guild: Discord.Guild;
}

/**
 * This message was sent from a DM.
 * Most notable difference is there is no member with roles and nickname
 */
export type DirectMessage = Discord.Message & {
  __tag: "direct";
  channel: Discord.DMChannel;
}

export type Message = ChannelMessage | DirectMessage;

/**
 * Sends a message back to the same 
 * 
 * @category Message
 */
export const reply = (content: string | Discord.MessageOptions) => {
  return (msg: Message) => C.send(content)(msg.channel);
}

export const replyTo = (msg: Message) => (content: string | Discord.MessageOptions) => reply(content)(msg);

/**
 * Type guard message -> DirectMessage
 */
export const isDirect = (msg: Message): msg is DirectMessage => !msg.guild;

/**
 * Type guard message -> ChannelMessage
 */
export const isChannel = (msg: Message): msg is ChannelMessage => !!msg.guild;

/**
 * Fold a message based on whether its direct or from a channel
 */
export const fold = <T>(
  onDirect: (m: DirectMessage)=>T,
  onServer: (m: ChannelMessage)=>T
) => {
  return (message: Message) => 
    isDirect(message) 
      ? onDirect(message) 
      : onServer(message);
}

export type Parsed = minimist.ParsedArgs;

/**
 * Gets the nth word in a message.
 * Returns an error if the property is missing
 * 
 * @category Parsed
 */
export const parse = (msg: Message): minimist.ParsedArgs => minimist(msg.content.split(" "));

/**
 * Lets you pass in either a message or a parsed version of a message
 */
const askParsed = (msg: Message | minimist.ParsedArgs) => {
  const isParsed = (_: Message | minimist.ParsedArgs): _ is Message => !!_.author;
  return isParsed(msg) ? parse(msg) : msg;
}

/**
 * Gets the nth word in a message.
 * 
 * @category Parsed
 */
export const nth = (idx: number) => {
  return flow(askParsed, p => O.fromNullable(p._[idx]));
}

/**
 * Gets the nth word in a message.
 * Returns an error if the property is missing
 * 
 * @category Parser
 */
export const nthE = (idx: number, onLeft: string) => flow(
  nth(idx), 
  E.fromOption (InvalidArgsError.lazy(onLeft))
);

/**
 * Syntactic sugar for getting the first parsed parameter after the command
 * 
 * `!command {route} [...params]`
 */
export const route = flow(
  nth(1), 
  O.map(_ => _.toLowerCase()), 
  O.getOrElse(() => "")
)

/**
 * Get an optional key from a parsed message
 * 
 * @category Parser
 */
export const get = (key: string) => {
  return flow(askParsed, p => O.fromNullable(p[key]));
}

/**
 * Gets a keyed property from a parsed message.
 * Returns an Error if the key is missing
 * 
 * @category Parser
 */
export const getE = (key: string, onLeft: string) => flow(
  get(key),
  E.fromOption (InvalidArgsError.lazy (onLeft))
)


/**
 * Checks that the message starts with `t`
 * 
 * @category rxjs
 */
export const trigger = (t: string) => RX.filter(<T extends Message>(msg: T) => {
  const [first] = msg.content.split(" ");
  return first.toLowerCase() === t.toLowerCase();
});

/**
 * When a message is sent and has no parameters or extra notation
 *
 * "!ping" is lonely
 * "!ping seb" is not lonely
 * 
 * @category rxjs
 */
export const lonely = RX.filter(<T extends Message>(msg: T) => msg.content.split(" ").length === 1);

/**
 * Restricts a command to a set of channels. If used outside of the channel ids,
 * will ignore it
 * 
 * @category rxjs
 */
export const restrict = (...channels: string[]) => RX.filter(<T extends Message>(msg: T) => channels.includes(msg.channel.id));

/**
 * Ignores a command when used in a channels. If used outside of the channel ids,
 * will ignore it
 * 
 * @category rxjs
 */
export const ignore = (...channels: string[]) => RX.filter(<T extends Message>(msg: T) => !channels.includes(msg.channel.id));


/**
 * Command that only works in direct messages
 * 
 * @category rxjs
 */
export const directOnly = RX.filter(isDirect);

/**
 * Command that only works in servers.
 * Note: This is handy as well for type guarding a message to include the `member` option for roles, nickname, etc
 * 
 * @category rxjs
 */
export const channelOnly = RX.filter(isChannel);