import * as Discord from "discord.js";
import minimist from "minimist";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

import {InvalidArgsError} from "@packages/common-errors";
import { flow } from "fp-ts/function";

export type ChannelMessage = Discord.Message & {
  __tag: "channel";
  channel: Discord.TextChannel;
  member: Discord.GuildMember;
  guild: Discord.Guild;
}

export type DirectMessage = Discord.Message & {
  __tag: "direct";
  channel: Discord.DMChannel;
}

export type Message = ChannelMessage | DirectMessage;

export const reply = (content: string | Discord.MessageOptions) => {
  return (msg: Message) => {
    // Discord.js typing is weird, we have to cast it for some reason *shrug*
    if (typeof content === 'string') msg.channel.send(content);
    else msg.channel.send(content);
  }
}

export const replyTo = (msg: Message) => (content: string | Discord.MessageOptions) => reply(content)(msg);

export const isDirect = (msg: Message): msg is DirectMessage => !msg.guild;
export const isChannel = (msg: Message): msg is ChannelMessage => !!msg.guild;

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
export const parse = (msg: Message): minimist.ParsedArgs => minimist(msg.content.split(" "));

export const nth = (idx: number) => {
  return (p: minimist.ParsedArgs) => O.fromNullable(p._[idx]);
}

export const nthE = (idx: number, onLeft: string) => flow(
  nth(idx), 
  E.fromOption (InvalidArgsError.lazy(onLeft))
);

export const get = (key: string) => {
  return (p: minimist.ParsedArgs) => O.fromNullable(p[key]);
}

export const getE = (key: string, onLeft: string) => flow(
  get(key),
  E.fromOption (InvalidArgsError.lazy (onLeft))
)