import { DISCORD_TOKEN, SERVER_ID } from './env';
import { Client, Message, GuildMember, APIMessage, TextChannel, APIMessageContentResolvable, MessageEmbed } from 'discord.js';
import { MessageOptions } from 'child_process';

// Connect

const client = new Client ();

client.on ('ready', () => console.log (`Bastion connected as '${client.user?.tag}'`));

client.on ('message', (msg: Message) => {
  if (msg.author.bot) return;
  messageHandler.forEach (f => f (msg));
});

client.login (DISCORD_TOKEN);

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

// Instance Utilities
export const Instance = {
  findMember: async (discordId: string) : Promise<GuildMember> => {
    const guild = await client.guilds.fetch (SERVER_ID);
    const member = await guild.members.fetch (discordId);

    return member;
  },

  broadcast: async (channelId: string, message: string | MessageEmbed) : Promise<Message> => {
    const channel = await client.channels.fetch (channelId);

    return (<TextChannel>channel).send (message);
  },

  editMessage: async (channelId: string, messageId: string, content: string | MessageEmbed) : Promise<Message> => {
    const channel = await client.channels.fetch (channelId);
    const message = await (<TextChannel>channel).messages.fetch (messageId);

    return message.edit (content);
  }
}