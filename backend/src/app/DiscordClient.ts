import * as Discord from 'discord.js';

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

export const connect = ({ token, onReady, onMessage, onReaction }: ClientOptions) : void => {
  client.on ('ready', () => onReady (client));

  client.on ('messageCreate', message => {
    if (!message.author.bot) {
      onMessage (message);
    }
  });

  client.on ('messageReactionAdd', async (r, u) => {
    try {
      const [reaction, user] = await fetchPartials (r, u);
      onReaction ({ type: 'add', reaction, user });
    }
    catch (e) {
      console.error ('Failed to fetch partials');
    }
  });

  client.on ('messageReactionRemove', async (r, u) => {
    try {
      const [reaction, user] = await fetchPartials (r, u);
      onReaction ({ type: 'remove', reaction, user });
    }
    catch (e) {
      console.error ('Failed to fetch partials');
    }
  });

  client.login (token);
}

/** 
 * Fetch a reference to the discord.js client object.
 * Please se only in register files, pass as a reference to others
 * as an explicit dependency (makes testing easier)
 */
export const getInstance = () : Discord.Client => client