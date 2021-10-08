import { DISCORD_TOKEN, SERVER_ID } from './env';
import { Client, Message, GuildMember, TextChannel } from 'discord.js';
import { none, option, Option } from 'ts-option';

import { channels } from '../config';
import * as env from './env';
import { MessageStream, WritableMessageStream } from '../utils/MessageStream';

// Connect

const client = new Client ();

client.on ('ready', () => {
  console.log (`Bastion connected as '${client.user?.tag}' v${env.VERSION}`);

  if (env.IS_PRODUCTION) {
    Instance
      .fetchChannel (channels.bot_admin)
      .then (c => c.send (`🤖 BoredBot Online! v${env.VERSION}`));
  }
});

client.on ('message', (msg: Message) => {
  if (msg.author.bot) return;

  Message$$.emit (msg);
});

client.login (DISCORD_TOKEN);

// Message Event
const Message$$ = new WritableMessageStream ();
export const Message$ : MessageStream = Message$$;


// Instance Utilities
export const Instance = {
  fetchMember: async (discordId: string) : Promise<Option<GuildMember>> => {
    try {
      const guild = await client.guilds.fetch (SERVER_ID);
      const member = await guild.members.fetch (discordId);

      return option (member);
    }
    catch (e) {
      return none;
    }
  },

  fetchMembers: async (discordIds: string[]) : Promise<GuildMember[]> => {
    const guild = await client.guilds.fetch (SERVER_ID);
    const members = await guild.members.fetch ({ user: discordIds });

    return [...members.values ()];
  }, 

  fetchChannel: async (channelId: string) : Promise<TextChannel> => {
    const channel = await client.channels.fetch (channelId);
    
    if (channel.type !== 'dm' && channel.type !== 'text') {
      throw new Error ('Channel is not of type \'dm\' or \'text');
    }

    return channel as TextChannel;
  },

  fetchMessage: async (channelId: string, messageId: string) : Promise<Message> => {
    const channel = await client.channels.fetch (channelId);
    const message = await (<TextChannel>channel).messages.fetch (messageId);

    return message;
  }
}