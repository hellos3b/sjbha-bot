import { MessageOptions, TextChannel } from "discord.js";

export interface Channel {
  id: string;
  send: (message: MessageOptions) => void;
  message: (message: string) => void;
}

export const Channel = (channel: TextChannel): Channel => ({
  id: channel.id,
  send: message => {
    channel.send(message)
  },
  message: message => {
    channel.send(message);
  }
});