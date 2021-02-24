import * as Client from "@packages/discord-fp/Client";
import * as C from "@packages/discord-fp/Command";
import * as M from "@packages/discord-fp/Message";

import { color, embed, author, description, field, thumbnail } from "@packages/embed";
import {DISCORD_TOKEN, NODE_ENV, SERVER_ID} from "./env";

const [client, message$] = Client.create(DISCORD_TOKEN);

export {message$};

// export const command = bastion.commander("!");
// export const server = bastion.server(SERVER_ID);

export const errorReporter = (original: M.Message) => (error: any) => {
  const message = embed(
    color(0xff0000),
    thumbnail("https://i.imgur.com/gWpSgKI.jpg"),
    author("Uncaught " + error.name),
    error.message && description(error.message),
    field("From", true)(`${original.author.username} in <#${original.channel.id}>`),
    field("Message", true)(original.content),
    error.stack && field("Stack")("```" + error.stack + "```")
  );

  console.error("Command failed to execute: ", {
    author: original.author,
    content: original.content
  }, error);

  if (NODE_ENV === 'production') {
    // todo: log it in #botadmin
  } else {
    original.channel.send(message);
  }
}