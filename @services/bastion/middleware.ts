import {Middleware, Router} from "@services/bastion";
import Debug from "debug";

const debug = Debug("@services:bastion");

/**
 * Middleware that restricts a command to specific channel ID.
 * If the command is called out of any of the provided channel IDs, it won't be executed
 * 
 * ```js
 * bastion.use("command", restrict(["1234"]), plugins.command);
 * ```
 */
export const restrict = (channels: string|string[]): Middleware => (req, next) => {
  channels = Array.isArray(channels) ? channels : [channels];
  
  if (channels.includes(req.channel.id)) {
    next()
  } else {
    debug("Used outside of restricted channels %O", channels)
  }
}

/**
 * Shorthand for commands that want to route the second word of a command,
 * here referred to as a "param"
 * 
 * example: `!command param` would pass `param` into the router
 * 
 * ```js
 * const router = new Router();
 * router.use("param", routes.param);
 * 
 * export default paramRouter(router);
 * ```
 * 
 */
export const paramRouter = (router: Router, opt: RouteParamOptions={}): Middleware => req => {
  if (!req.route && !!opt.default) {
    // route = opt.default;
  }

  router.handle(req);
}

type RouteParamOptions = {
  /** What to route to if no param is supplied. If not set, will ignore the command */
  default?: string;
}