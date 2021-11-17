import * as Discord from 'discord.js';
import { none, option, Option } from 'ts-option';

import { WritableMessageStream, WritableStream } from '../utils/MessageStream';

import * as env from './env';

// Connect

const client = new Discord.Client ({
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

const fetchPartials = async (
  reaction: Discord.MessageReaction | Discord.PartialMessageReaction,
  user: Discord.User | Discord.PartialUser
) => {
  // If either of these are partial, fetch them
  const [reaction2, user2] = await Promise.all ([
    (reaction.partial) ? reaction.fetch () : Promise.resolve (reaction),
    (user.partial) ? user.fetch () : Promise.resolve (user)
  ]);

  return [reaction2, user2] as const;
}

type ReactionEvent = { 
  type: 'add' | 'remove'; 
  reaction: Discord.MessageReaction; 
  user: Discord.User; 
};

type ClientOptions = {
  token: string;
  onReady: (client: Discord.Client) => void;
  onMessage: (message: Discord.Message) => void;
  onReaction: (event: ReactionEvent) => void;
}

export const connect = ({ token, onReady, onMessage, onReaction}: ClientOptions) : void => {
  client.on("ready", () => onReady(client));

  client.on("messageCreate", message => {
    if (!message.author.bot) {
      onMessage (message);
    }
  });

  client.on("messageReactionAdd", async (r, u) => {
    try {
      const [reaction, user] = await fetchPartials(r, u);
      onReaction({ type: "add", reaction, user });
    }
    catch (e) {
      console.error (`Failed to fetch partials`);
    }
  });

  client.on("messageReactionRemove", async (r, u) => {
    try {
      const [reaction, user] = await fetchPartials(r, u);
      onReaction({ type: "remove", reaction, user });
    }
    catch (e) {
      console.error (`Failed to fetch partials`);
    }
  });

  client.login (token);
}

export const onClientReady : Promise<void> = new Promise (resolve => client.once ('ready', () => resolve (null))).then (() => { /** */ });


// Message Event
const Message$$ = new WritableMessageStream ();
export const Message$ = Message$$.readonly;


// Reaction events
type Reaction = { type: 'add' | 'remove'; reaction: Discord.MessageReaction; user: Discord.User; };
const Reaction$$ = new WritableStream <Reaction> ();
export const Reaction$ = Reaction$$.readonly;


// Instance Utilities
export namespace Instance {
  export async function fetchMember(discordId: string) : Promise<Option<Discord.GuildMember>> {
    try {
      const guild = await client.guilds.fetch (env.SERVER_ID);
      const member = await guild.members.fetch (discordId);

      return option (member);
    }
    catch (e) {
      return none;
    }
  }

  export async function fetchMembers(discordIds: string[]) : Promise<Discord.GuildMember[]> {
    const guild = await client.guilds.fetch (env.SERVER_ID);
    const members = await guild.members.fetch ({ user: discordIds });

    return [...members.values ()];
  }

  export async function fetchChannel(channelId: string) : Promise<Discord.TextChannel | Discord.ThreadChannel> {
    const channel = await client.channels.fetch (channelId);
    
    if (!channel) {
      throw new Error (`Could not fetchChannel() '${channelId}': Channel does not exist`);
    }
    if (channel.type !== 'DM' && channel.type !== 'GUILD_TEXT' && channel.type !== 'GUILD_PUBLIC_THREAD') {
      throw new Error (`Could not fetchChannel() '${channelId}': Channel is a dm or text channel (got type: ${channel.type}) `);
    }

    return channel as Discord.TextChannel;
  }

  export async function fetchMessage (channelId: string, messageId: string) : Promise<Discord.Message> {
    const channel = await client.channels.fetch (channelId);
    const message = await (<Discord.TextChannel>channel).messages.fetch (messageId);

    return message;
  }
}