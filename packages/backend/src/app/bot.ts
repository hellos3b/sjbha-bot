import { DISCORD_TOKEN } from './env';
import { Client, Message } from 'discord.js';

// Message Event

export type MessageHandler = (message: Message) => void;

const messageHandler : MessageHandler[] = [];

export type NextFn = () => void;
export type MessageMiddleware = (message: Message, next: NextFn) => void;

/**
 * Compose a series middleware together to create a command.
 * 
 * Middleware is used as helpers for filtering and routing an incoming message.
 * 
 * ```ts
 * compose (
 *   startsWith ("!ping"),
 *   reply ("Pong!")
 * )
 * ```
 * 
 * @returns A Handler that can be passed to `onMessageEvent`
 */
export const compose = (...middlewares: MessageMiddleware[]) : MessageHandler => {
  if (!middlewares.length) {
    return _ => { /** Ignore */ }
  }

  const [run, ...tail] = middlewares;
  const next = compose (...tail);

  return message => run (message, () => next (message));
}

/**
 * Listen to messages from the bot.
 * 
 * todo: explain middleware
 */
export const onMessage = (...middleware: MessageMiddleware[]) : void => {
  messageHandler.push (compose (...middleware));
}

// Connect

const client = new Client ();

client.on ('ready', () => console.log (`Bastion connected as '${client.user?.tag}'`));

client.on ('message', (msg: Message) => {
  if (msg.author.bot) return;
  messageHandler.forEach (f => f (msg));
});

client.login (DISCORD_TOKEN);





































// const [client, message$] = Client.create(DISCORD_TOKEN);

// export {message$};

// export function command(cmd: string) {
//   return message$.pipe(M.trigger(cmd));
// }

// export function broadcast(channelId: string) {
//   return (content: string | MessageOptions) => pipe(
//     C.find(channelId)(client),
//     TE.chainW (C.send(content))
//   )
// }

// export function findMember(id: string) {
//   return pipe(
//     G.find(SERVER_ID)(client),
//     TE.chain (U.find(id))
//   );
// }

// export const reportError = (original: M.Message) => (error: any) => {
//   const message = embed(
//     color(0xff0000),
//     thumbnail("https://i.imgur.com/gWpSgKI.jpg"),
//     author("Uncaught " + error.toString()),
//     error.message && description(error.message),
//     field("From", true)(`${original.author.username} in <#${original.channel.id}>`),
//     field("Message", true)(original.content),
//     error.stack && field("Stack")("```" + error.stack + "```")
//   );

//   console.error("Command failed to execute: ", {
//     from: original.author.username,
//     message: original.content
//   }, error);

//   if (NODE_ENV === 'production') {
//     // todo: log it in #botadmin
//   } else {
//     original.channel.send(message);
//   }
// }