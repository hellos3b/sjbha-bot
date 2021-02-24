import {map} from "fp-ts/TaskEither";
import {pipe} from "fp-ts/function";

import * as M from "@packages/discord-fp/Message";

import {message$} from "@app/bot";
import channels from "@app/channels";

import {aqiMessage} from "./src/aqi";

/**
 * Picks a couple of sensors from a public Purple Air API,
 * and renders them in a nice little embed
 */
message$.pipe(
  M.startsWith("!aqi"),
  M.restrict(channels.shitpost)
).subscribe(msg => pipe(
  aqiMessage(),
  map (M.replyTo(msg))
));