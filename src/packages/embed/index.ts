import * as R from "ramda";
import {MessageEmbedOptions, MessageOptions} from "discord.js";

type EmbedProperty = (obj: MessageEmbedOptions) => MessageEmbedOptions;

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
export const embed = (props: EmbedProperty[]): MessageOptions => ({
  embed: props.reduce((em, p) => (!p) ? em : p(em), {})
});

export const color = (value: number): EmbedProperty => {
  return obj => ({...obj, color: value });
};

export const author = R.curry((name: string, icon_url: string): EmbedProperty => {
  return obj => ({...obj, author: {name, icon_url}});
});

export const field = R.curry((name: string, value: string, inline: boolean = false): EmbedProperty => {
  const field = {name, value, inline};

  return obj => {
    const fields = (obj.fields || []).concat(field);
    return {...obj, fields};
  };
});