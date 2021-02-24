import {message$} from "@app/bot";
import * as C from "@packages/discord-fp/Command";
import * as M from "@packages/discord-fp/Message";

message$ 
  .pipe (C.trigger("!pong"))
  .subscribe (M.reply("...ping?"));