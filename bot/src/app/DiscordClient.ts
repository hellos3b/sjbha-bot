import * as Discord from 'discord.js';
import * as Log from './log';

const log = Log.make ('app:DiscordClient');

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
  onCommand: (event: Discord.CommandInteraction) => void;
}

// Connect
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

const client = new Discord.Client ({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.DirectMessages
  ],
  partials: [
    Discord.Partials.Message,
    Discord.Partials.Channel,
    Discord.Partials.Reaction
  ]
});

export const connect = ({ token, onReady, onMessage, onReaction, onCommand }: ClientOptions): void => {
  client.on ('ready', () => onReady (client));

  client.on ('messageCreate', message => {
    if (!message.author.bot) {
      Log.runWithContext (() => onMessage (message));
    }
  });

  client.on ('messageReactionAdd', async (r, u) => {
    try {
      const [reaction, user] = await fetchPartials (r, u);
      Log.runWithContext (() => onReaction ({ type: 'add', reaction, user }));
    }
    catch (e) {
      log.error ('Failed to fetch partials');
    }
  });

  client.on ('messageReactionRemove', async (r, u) => {
    try {
      const [reaction, user] = await fetchPartials (r, u);
      Log.runWithContext (() => onReaction ({ type: 'remove', reaction, user }));
    }
    catch (e) {
      log.error ('Failed to fetch partials');
    }
  });

  client.on ('interactionCreate', async interaction => {
    if (!interaction.isCommand ()) return;
    Log.runWithContext (() => onCommand (interaction));
  })

  client.login (token);
}

/** 
 * Fetch a reference to the discord.js client object.
 * Please se only in register files, pass as a reference to others
 * as an explicit dependency (makes testing easier)
 */
export const getInstance = (): Discord.Client => client