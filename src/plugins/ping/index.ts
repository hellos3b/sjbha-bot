import {command} from "@app/bot";
import * as M from "@packages/discord-fp/Message";
import logger from "@packages/logger";

const log = logger("ping");

command("!pong")
  .subscribe (msg => {
    log.info("Yes I'm alive!!");

    const pipeline = M.reply("PING!")(msg);
    pipeline();
  });