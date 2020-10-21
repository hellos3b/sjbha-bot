import Debug from "debug";
import Bastion, {Request} from './index';
import {includes} from "ramda";
import {filter} from "rxjs/operators";
import { MessageOptions } from "discord.js";

const debug = Debug("@services:bastion");


/****************************************************************
 *                                                              *
 * Stream                                                       *
 *                                                              *
 ****************************************************************/

/** Stream that emits on message. Emits Bastion `Request` object */
export const message$ = Bastion.message$;

/** Filters stream based off  */
export const cmd = (cmd: string) => filter<Request>(req => req.route === cmd)

/** Filter route based off the first word after command. `!command {param}` */
export const param = (route: string) => filter<Request>(req => req.args[0] === route);

/** Filters if the command is used by itself */
export const noParam = () => filter<Request>(req => !req.args.length);

/** Filters a message that is used outside one of the provided channel ids */
export const restrict = (...channelIds: string[]) => filter<Request>(req => {
  if (includes(req.channel.id, channelIds)) return true;

  debug(`Command used outside of restricted channels (${channelIds})`);
  return false;
});

/****************************************************************
 *                                                              *
 * Discord                                                      *
 *                                                              *
 ****************************************************************/

export type Field = {
  name: string;
  value: string;
  inline?: boolean;
};

export type Embed = MessageOptions["embed"];

/** Create a field to use inside of an embed */
export const field = (name: string, value: string|number, inline=true): Field => ({name, value: String(value), inline});

/** Sets up the shape for the `fields` prop in an embed */
export const asField = (name: string, inline=true) => (value: string|number) => field(name, value, inline);