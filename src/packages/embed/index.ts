import * as R from "ramda";
import {Reader} from "fp-ts/Reader";
import {MessageEmbed, MessageOptions} from "discord.js";

type EmbedProperty = (obj: MessageEmbed) => MessageEmbed;
type Falsy = false | 0 | "" | null | undefined 

/**
 * Create an embed from a flat array of objects.
 * Import the other helpers from here to make building an embed easy
 * 
 * ```ts
 * embed([
 *   color(0xffffff),
 *   author("Sebastian", "https://"),
 *   field("Nickname")("seb")
 * ])
 * ```
 */
export const embed = (...props: (EmbedProperty | Falsy)[]): MessageOptions => {
  const message = new MessageEmbed();
  props.forEach(opt => opt && opt(message));

  return message;
};

export const title = (value: string): Reader<MessageEmbed, MessageEmbed> => {
  return em => em.setTitle(value);
}

/**
 * Set the color of the embed
 */
export const color = (value: number): Reader<MessageEmbed, MessageEmbed> => {
  return em => em.setColor(value);
};

/**
 * Author component
 */
export const author = (name: string, icon_url?: string): Reader<MessageEmbed, MessageEmbed> => {
  const prop: {[key: string]: any} = {name};

  if (icon_url) {
    prop.icon_url = icon_url;
  }

  return em => em.setAuthor(name, icon_url);
};

/**
 * Creates a field, defaults to inline.
 * If the passed in `value` is null, the field will not be added
 */
export const field = (name: string, inline: boolean = false) => (value: any): Reader<MessageEmbed, MessageEmbed> => {
  return em => !value ? em : em.addField(name, value, inline);
};

export const description = (content: string): Reader<MessageEmbed, MessageEmbed> => {
  return em => em.setDescription(content);
}

export const thumbnail = (url: string): Reader<MessageEmbed, MessageEmbed> => {
  return em => em.setThumbnail(url);
};


export const footer = (value: string): Reader<MessageEmbed, MessageEmbed> => {
  return em => em.setFooter(value);
};