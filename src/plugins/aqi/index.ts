import {chain} from "fp-ts/TaskEither";
import {pipe} from "fp-ts/function";

import * as M from "@packages/discord-fp/Message";

import {command} from "@app/bot";
import {aqiMessage} from "./src/aqi";

import logger from "@packages/logger";
const log = logger("aqi");

/**
 * Picks a couple of sensors from a public Purple Air API,
 * and renders them in a nice little embed
 */
command("!aqi")
  .subscribe(msg => {
    log.info("Showing AQI");

    const pipeline = pipe(
      aqiMessage(),
      chain (M.replyTo(msg))
    );
  
    pipeline();
  });