import Debug from "debug";
import Bastion, {Request} from './index';
import {includes} from "ramda";
import {filter} from "rxjs/operators";

const debug = Debug("@services:bastion");

export const message$ = Bastion.message$;

export const cmd = (cmd: string) => filter<Request>(req => req.route === cmd)

export const param = (route: string) => filter<Request>(req => req.args[0] === route);

export const noParam = () => filter<Request>(req => !req.args.length);

export const restrict = (...channelIds: string[]) => filter<Request>(req => {
  if (includes(req.channel.id, channelIds)) return true;

  debug(`Command used outside of restricted channels (${channelIds})`);
  return false;
});