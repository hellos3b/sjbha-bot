import * as R from "ramda";
import {Reader} from "fp-ts/Reader";
import {MessageEmbed, MessageOptions} from "discord.js";

type EmbedProperty = (obj: MessageEmbed) => MessageEmbed;

/**
 * Create an embed from a flat array of objects.
 * Import the other helpers from here to make building an embed easy
 * 
 * ```ts
 * embed([
 *   color(0xffffff),
 *   author("Sebastian", "https://"),
 *   field("Nickname", "seb")
 * ])
 * ```
 */
export const embed = (...props: EmbedProperty[]): MessageOptions => {
  const message = new MessageEmbed();
  props.forEach(opt => opt && opt(message));

  return message;
};

export const color = (value: number): Reader<MessageEmbed, MessageEmbed> => {
  return em => em.setColor(value);
};

export const author = (name: string, icon_url?: string): Reader<MessageEmbed, MessageEmbed> => {
  const prop: {[key: string]: any} = {name};

  if (icon_url) {
    prop.icon_url = icon_url;
  }

  return em => em.setAuthor(name, icon_url);
};

export const field = (name: string, inline: boolean = false) => (value: any): Reader<MessageEmbed, MessageEmbed> => {
  return em => em.addField(name, value, inline);
};

export const description = (content: string): Reader<MessageEmbed, MessageEmbed> => {
  return em => em.setDescription(content);
}

export const thumbnail = (url: string): Reader<MessageEmbed, MessageEmbed> => {
  return em => em.setThumbnail(url);
};