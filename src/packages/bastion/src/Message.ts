import * as Discord from "discord.js";
import {Args} from "./Args";
import {Server, server} from "./Server";
import {Member, fromMember, fromUser} from "./Member";
import {Channel, channel} from "./Channel";
import {pipe} from "fp-ts/function";

type MessageDetails = {
  readonly args: Args;
  readonly author: Member;
  readonly content: string;
  readonly channel: Channel;
};

export type ServerMessage = MessageDetails & {
  readonly type: "message";
  readonly server: Server;
};

export type DirectMessage = MessageDetails & {
  readonly type: "direct";
};

export type Message = ServerMessage | DirectMessage;

export const Message = (message: Discord.Message): Message => {
  const msg: MessageDetails = {
    args: Args(message.content),
    author: fromUser(message.author),
    content: message.content,
    channel: channel(message.channel as Discord.TextChannel)
  };

  if (!message.guild) {
    return {...msg, type: "direct"};
  }

  return {
    ...msg,
    type: "message",
    server: server(message.guild),
    author: pipe(
      message.guild.member(message.author.id)!, // I hate this, but this library is weird
      fromMember
    )
  };
};