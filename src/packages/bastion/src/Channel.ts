import * as Discord from "discord.js";
import {pipe} from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import {NotFound} from "@packages/common-errors";
export interface Channel {
  id: string;
  send: (message: string|Discord.MessageOptions) => void;
}

export const channel = (channel: Discord.TextChannel): Channel => ({
  id: channel.id,
  send: message => {
    // This is the dumbest bug ever, 
    // but the Discord library types need me to typecast the message 
    // otherwise we get a type error
    if (typeof message === 'string') {
      channel.send(message);
    } else {
      channel.send(message);
    }
  }
});

export const fromGuild = (guild: Discord.Guild) => (id: string): TE.TaskEither<Error, Channel> => pipe(
  TE.tryCatch(
    async () => {
      const ch = guild.channels.cache.get(id);
      if (!ch) throw new Error("Channel doesn't exist");

      return channel(ch as Discord.TextChannel);
    },
    NotFound.fromError
  )
)