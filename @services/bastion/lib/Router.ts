import {map} from "lodash";
import Request from "./Request";
import Debug from "debug";
import shortid from "shortid";

const debug = Debug("bastion");

export default class Router {
  private routes = new Map<string, Middleware[]>();

  use = (route: string, ...mw: Middleware[]) => {
    this.routes.set(route, mw);
  }

  async handle(route: string, req: Request) {
    const middlewares = this.routes.get(route);

    // If no route, exit out
    if (!middlewares) {
      debug("route missing: %o", route);
      return;
    }

    const exec = async (idx: number) => {
      const callback = middlewares[idx];
      if (!callback) return;

      try {
        // We're only `await`ing to make sure we can catch the error
        await callback(req, () => exec(idx + 1));
      } catch (e) {
        const id = shortid();
  
        await req.reply(`I can't do that because an unknown error occured. It's been logged under ID **${id}**`)

        debug(`ERROR ${id}: An uncaught error occured in `)
        throw e;
      }
    }

    exec(0)
  }
}

export type Middleware = (request: Request, next: ()=>void)=>void|Promise<void>;