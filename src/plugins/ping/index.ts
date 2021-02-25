import {message$} from "@app/bot";
import * as M from "@packages/discord-fp/Message";


import logger from "@packages/logger";
const log = logger("ping");

message$ 
  .pipe (M.trigger("!pong"))
  .subscribe (msg => {
    log.info("Yes I'm alive!!");

    const pipeline = M.reply("PING!")(msg);
    pipeline();
  });