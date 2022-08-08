import { MongoDb } from '@sjbha/app';
import { formatDistance } from 'date-fns';
import * as DiscordJs from 'discord.js';
import { Command, Option, SubCommand } from '@sjbha/common/SlashCommand';
import { channels } from '@sjbha/server';

const COLLECTION = 'tldrs';
const MAX_TLDR_DISPLAY = 10;
const EMBED_COLOR = 11393254;

interface Tldr {
  message: string;
  from: string;
  timestamp: Date;
  channelID: string;
  channel: string;
}

const Tldrs = {
  fetch: async () => {
    const collection = await MongoDb.getCollection<Tldr> (COLLECTION);
    return collection
      .find ()
      .sort ({ timestamp: -1 })
      .limit (MAX_TLDR_DISPLAY)
      .toArray ();
  },

  insert: async (tldr: Tldr) => {
    const collection = await MongoDb.getCollection<Tldr> (COLLECTION);
    await collection.insertOne (tldr);
    return tldr;
  }
}

const list = SubCommand.make ({
  name:        'list',
  description: 'See a list of the most recent tldrs',

  async execute(interaction) {
    const tldrs = await Tldrs.fetch ();

    const response = new DiscordJs.MessageEmbed ({
      title:  '💬 TLDR',
      color:  EMBED_COLOR,
      fields: tldrs.map (tldr => {
        const timestamp = formatDistance (tldr.timestamp, new Date ());
        const value = `*${timestamp} • ${tldr.from} • <#${tldr.channelID}>*`;
        return { name: tldr.message, value };
      })
    });

    const ephemeral = interaction.channelId !== channels.shitpost;
    interaction.reply ({ embeds: [response], ephemeral });
  }
});

const Note = Option.make ({
  name:        'note',
  description: 'The tldr you want to save',
  required:    true
});

const save = SubCommand.make ({
  name:        'save',
  description: 'Save a new TLDR into sjbha history',
  options:     [Note],

  async execute(interaction) {
    if (!(interaction.channel instanceof DiscordJs.TextChannel)) return;

    const note = Note.getExn (interaction);
    await Tldrs.insert ({
      message:   note,
      from:      interaction.user.username,
      timestamp: new Date (),
      channelID: interaction.channel.id,
      channel:   interaction.channel.name
    });

    const response = new DiscordJs.MessageEmbed ({
      description: `📖 ${note}`,
      color:       EMBED_COLOR
    });

    interaction.reply ({ embeds: [response] });
  }
})

export default Command.make ({
  name:        'tldr',
  description: 'Summarize things that happen on discord',
  subcommands: [list, save],
  async execute(interaction) {
    if (!(interaction.channel instanceof DiscordJs.TextChannel)) return;

    switch (interaction.options.getSubcommand ()) {
      case save.name:
        save.execute (interaction);
        break;

      case list.name:
        list.execute (interaction);
        break;
    }
  }
});