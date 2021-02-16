import {createBastion, Message} from "@packages/bastion";
import { color, embed, author, description, field, thumbnail } from "@packages/embed";
import {DISCORD_TOKEN, NODE_ENV, SERVER_ID} from "./env";

const bastion = createBastion(DISCORD_TOKEN);

export const command = bastion.commander("!");
export const server = bastion.server(SERVER_ID);

export const errorReporter = (original: Message) => (error: any) => {
  const message = embed([
    color(0xff0000),
    thumbnail("https://i.imgur.com/gWpSgKI.jpg"),
    author("Uncaught " + error.name),
    error.message && description(error.message),
    field("From", `${original.author.name} in <#${original.channel.id}>`, true),
    field("Message", original.content, true),
    field("Args", "`" + original.args + "`"),
    error.stack && field("Stack", "```" + error.stack + "```")
  ]);

  console.error("Command failed to execute: ", {
    args: original.args.toString(),
    author: original.author,
    content: original.content
  }, error);

  if (NODE_ENV === 'production') {
    // todo: log it in #botadmin
  } else {
    original.channel.send(message);
  }
}