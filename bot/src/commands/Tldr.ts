import { MongoDb } from "@sjbha/app";
import { embed, isGuildChannel } from "@sjbha/utils/Discord";
import { formatDistance } from "date-fns";
import * as DiscordJs from "discord.js";

const COLLECTION = "tldrs";
const MAX_TLDR_DISPLAY = 10;
const EMBED_COLOR = 11393254;

type Tldr = {
  message: string;
  from: string;
  timestamp: Date;
  channelID: string;
  channel: string;
}

const Tldrs = {
  fetch: async () => {
    const collection = await MongoDb.getCollection<Tldr>(COLLECTION);
    return collection
      .find()
      .sort({ timestamp: -1 })
      .limit(MAX_TLDR_DISPLAY)
      .toArray();
  },

  insert: async (tldr: Tldr) => {
    const collection = await MongoDb.getCollection<Tldr>(COLLECTION);
    await collection.insertOne(tldr);
    return tldr;
  }
}

// list out the most recent tldrs in an embed
export const cmdList = async (message: DiscordJs.Message): Promise<void> => {
  const tldrs = await Tldrs.fetch();

  const response = embed({
    title: `💬 TLDR`,
    color: EMBED_COLOR,
    fields: tldrs.map(tldr => {
      const timestamp = formatDistance(tldr.timestamp, new Date());
      const value = `*${timestamp} • ${tldr.from} • <#${tldr.channelID}>*`;
      return { name: tldr.message, value };
    })
  });

  message.channel.send({ embeds: [response] });
}

// create a new tldr into the database
export const cmdSave = (note: string) => async (message: DiscordJs.Message) => {
  if (!isGuildChannel(message.channel))
    return;

  await Tldrs.insert({
    message: note,
    from: message.author.username,
    timestamp: new Date(),
    channelID: message.channel.id,
    channel: message.channel.name
  });

  const response = embed({
    description: `📌 TLDR Saved`,
    color: EMBED_COLOR
  });

  message.reply({ embeds: [response] });
}