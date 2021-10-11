import { Client, Message, GuildMember, TextChannel, MessageReaction, User } from 'discord.js';
import { none, option, Option } from 'ts-option';

import { WritableMessageStream, WritableStream } from '../utils/MessageStream';

import { channels } from '../config';
import * as env from './env';

// Connect

const client = new Client ({
  intents: [
    'GUILDS', 
    'GUILD_MESSAGES',
    'GUILD_MESSAGE_REACTIONS', 
    'GUILD_MEMBERS',
    'DIRECT_MESSAGES'
  ],
  partials: [
    'MESSAGE', 
    'CHANNEL', 
    'REACTION'
  ]
});

client.on ('ready', () => {
  console.log (`Bastion connected as '${client.user?.tag}' v${env.VERSION}`);

  if (env.IS_PRODUCTION) {
    Instance
      .fetchChannel (channels.bot_admin)
      .then (c => c.send (`🤖 BoredBot Online! v${env.VERSION}`));
  }
});

client.on ('messageCreate', (msg: Message) => {
  if (msg.author.bot) return;

  Message$$.emit (msg);
});


client.on ('messageReactionAdd', async (r, u) => {
  try {
    // If either of these are partial, fetch them
    const [reaction, user] = await Promise.all ([
      (r.partial) ? r.fetch () : Promise.resolve (r),
      (u.partial) ? u.fetch () : Promise.resolve (u)
    ]);

    Reaction$$.emit ({ type: 'add', reaction, user });
  }
  catch (e) {
    console.error ('Failed to fetch partial reaction or user');
  }
});

client.on ('messageReactionRemove', async (r, u) => {
  try {
    // If either of these are partial, fetch them
    const [reaction, user] = await Promise.all ([
      (r.partial) ? r.fetch () : Promise.resolve (r),
      (u.partial) ? u.fetch () : Promise.resolve (u)
    ]);

    Reaction$$.emit ({ type: 'remove', reaction, user });
  }
  catch (e) {
    console.error ('Failed to fetch partial reaction or user');
  }
});

export const onClientReady : Promise<void> = new Promise (resolve => client.once ('ready', () => resolve (null))).then (() => { /** */ });
client.login (env.DISCORD_TOKEN);


// Message Event
const Message$$ = new WritableMessageStream ();
export const Message$ = Message$$.readonly;


// Reaction events
type Reaction = { type: 'add' | 'remove'; reaction: MessageReaction; user: User; };
const Reaction$$ = new WritableStream <Reaction> ();
export const Reaction$ = Reaction$$.readonly;


// Instance Utilities
export namespace Instance {
  export async function fetchMember(discordId: string) : Promise<Option<GuildMember>> {
    try {
      const guild = await client.guilds.fetch (env.SERVER_ID);
      const member = await guild.members.fetch (discordId);

      return option (member);
    }
    catch (e) {
      return none;
    }
  }

  export async function fetchMembers(discordIds: string[]) : Promise<GuildMember[]> {
    const guild = await client.guilds.fetch (env.SERVER_ID);
    const members = await guild.members.fetch ({ user: discordIds });

    return [...members.values ()];
  }

  export async function fetchChannel(channelId: string) : Promise<TextChannel> {
    const channel = await client.channels.fetch (channelId);
    
    if (!channel || channel.type !== 'DM' && channel.type !== 'GUILD_TEXT') {
      throw new Error ('Channel is not of type \'dm\' or \'text');
    }

    return channel as TextChannel;
  }

  export async function fetchMessage (channelId: string, messageId: string) : Promise<Message> {
    const channel = await client.channels.fetch (channelId);
    const message = await (<TextChannel>channel).messages.fetch (messageId);

    return message;
  }
}