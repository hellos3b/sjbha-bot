import {map} from "fp-ts/TaskEither";
import {pipe} from "fp-ts/function";

import {command} from "@app/bastion";
import channels from "@app/channels";

import {aqiMessage} from "./sensors";

/**
 * Picks a couple of sensors from a public Purple Air API,
 * and renders them in a nice little embed
 */
command("aqi")
  .restrict(channels.shitpost)
  .subscribe(({ channel }) => pipe(
    aqiMessage(),
    map (channel.send)
  )());