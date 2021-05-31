import { MessageEmbed, MessageOptions } from 'discord.js';

type EmbedProperty = (obj: MessageEmbed) => MessageEmbed;
type Falsy = false | 0 | '' | null | undefined;
type EmbedBuilder = EmbedProperty | Falsy;

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
export const embed = (...props: EmbedBuilder[]): MessageOptions => {
  const message = props.reduce ((msg, fn) => {
    if (fn) return fn (msg);

    return msg;
  }, new MessageEmbed ());

  return message;
};

export const title = (value: string): EmbedBuilder => 
  embed => embed.setTitle (value)

/**
 * Set the color of the embed
 */
export const color = (value: number): EmbedBuilder => 
  embed => embed.setColor (value);

/**
 * Author component
 */
export const author = (name: string, icon_url?: string): EmbedBuilder => 
  embed => embed.setAuthor (name, icon_url);

/**
 * Creates a field, defaults to inline.
 * 
 * If the passed in `value` is null, the field will not be added
 */
export const field = (name: string, inline = false) => (value: number | string | null): EmbedBuilder => 
  embed => !value ? embed : embed.addField (name, value, inline);

export const description = (content: string): EmbedBuilder => 
  embed => embed.setDescription (content)

export const thumbnail = (url: string): EmbedBuilder => 
  embed => embed.setThumbnail (url);


export const footer = (value: string): EmbedBuilder => 
  embed => embed.setFooter (value);