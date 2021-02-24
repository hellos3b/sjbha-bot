import {MessageOptions} from "discord.js";
import * as TE from "fp-ts/TaskEither";
import * as Client from "@packages/discord-fp/Client";
import * as M from "@packages/discord-fp/Message";
import * as G from "@packages/discord-fp/Guild";
import * as U from "@packages/discord-fp/User";
import * as C from "@packages/discord-fp/Channel";

import { color, embed, author, description, field, thumbnail } from "@packages/embed";
import {DISCORD_TOKEN, NODE_ENV, SERVER_ID} from "./env";
import { pipe } from "fp-ts/lib/function";

const [client, message$] = Client.create(DISCORD_TOKEN);

export {message$};

export function broadcast(channelId: string) {
  return (content: string | MessageOptions) => pipe(
    C.find(channelId)(client),
    TE.chainW (C.send(content))
  )
}

export function findMember(id: string) {
  return pipe(
    G.find(SERVER_ID)(client),
    TE.chain (U.find(id))
  );
}

export const reportError = (original: M.Message) => (error: any) => {
  const message = embed(
    color(0xff0000),
    thumbnail("https://i.imgur.com/gWpSgKI.jpg"),
    author("Uncaught " + error.toString()),
    error.message && description(error.message),
    field("From", true)(`${original.author.username} in <#${original.channel.id}>`),
    field("Message", true)(original.content),
    error.stack && field("Stack")("```" + error.stack + "```")
  );

  console.error("Command failed to execute: ", {
    from: original.author.username,
    message: original.content
  }, error);

  if (NODE_ENV === 'production') {
    // todo: log it in #botadmin
  } else {
    original.channel.send(message);
  }
}