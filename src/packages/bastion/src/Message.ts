import * as Discord from "discord.js";
import {Args} from "./Args";
import {Server} from "./Server";
import {DiscordUser} from "./DiscordUser";

type MessageDetails = {
  readonly args: Args;
  readonly author: DiscordUser;
  readonly content: string;
  readonly channel: Discord.TextChannel;
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
    author: DiscordUser(message.author),
    content: message.content,
    channel: message.channel as Discord.TextChannel
  };

  if (!message.guild) {
    return {...msg, type: "direct"};
  }

  const server = Server(message.guild);
  const member = message.guild.member(message.author.id);

  return {
    ...msg,
    type: "message",
    server: server,
    author: DiscordUser(message.author, member || undefined)
  };
};