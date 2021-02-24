import {message$} from "@app/bot";
import * as M from "@packages/discord-fp/Message";

message$ 
  .pipe (M.startsWith("!pong"))
  .subscribe (M.reply("...ping?"));