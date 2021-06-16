import { DISCORD_TOKEN, SERVER_ID } from './env';
import * as Discord from 'discord.js';

import { Member, Message, TextChannel } from './discord-js';

// Connect

const client = new Discord.Client ();

client.on ('ready', () => console.log (`Bastion connected as '${client.user?.tag}'`));

client.on ('message', (msg: Discord.Message) => {
  if (msg.author.bot) return;

  const message = Message (msg);
  [...messageHandlers].forEach (f => f (message));
});

client.login (DISCORD_TOKEN);

// Message Event

export type MessageHandler = (message: Message) => void;

const messageHandlers : Set<MessageHandler> = new Set ();

export type NextFn = () => void;
export type MessageMiddleware = (message: Message, next: NextFn) => void;

export type UnsubscribeHandler = () => void;

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
export const onMessage = (...middleware: MessageMiddleware[]) : UnsubscribeHandler => {
  const handler = compose (...middleware);

  messageHandlers.add (handler);

  return () => messageHandlers.delete (handler);
}

// Instance Utilities
export const Instance = {
  fetchMember: async (discordId: string) : Promise<Member> => {
    const guild = await client.guilds.fetch (SERVER_ID);
    const member = await guild.members.fetch (discordId);

    return Member (member);
  },

  fetchMembers: async (discordIds: string[]) : Promise<Member[]> => {
    const guild = await client.guilds.fetch (SERVER_ID);
    const members = await guild.members.fetch ({ user: discordIds });

    return members.map (Member);
  }, 

  fetchChannel: async (channelId: string) : Promise<TextChannel> => {
    const channel = await client.channels.fetch (channelId);
    
    if (channel.type !== 'dm' && channel.type !== 'text') {
      throw new Error ('Channel is not of type \'dm\' or \'text');
    }

    return TextChannel (<Discord.TextChannel>channel);
  },

  fetchMessage: async (channelId: string, messageId: string) : Promise<Message> => {
    const channel = await client.channels.fetch (channelId);
    const message = await (<Discord.TextChannel>channel).messages.fetch (messageId);

    return Message (message);
  }
}