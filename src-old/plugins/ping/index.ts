import {command} from "@app/bot";
import logger from "@packages/logger";
import { pipe } from "fp-ts/lib/pipeable";

const log = logger("ping");

export default pipe(
  command ("!ping"),
  reply ("PING!")
);

export default pipe(
  command ("!fit"),
  restrict ([ "channel-A" ]),
  route ({
    leaderboard: fitleaderboard
  })
)

command("!pong").run(msg => msg.reply("PING!"));