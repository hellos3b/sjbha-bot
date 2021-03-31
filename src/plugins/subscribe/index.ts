import * as O from "fp-ts/Option";
import {pipe, flow} from "fp-ts/function";

import {command} from "@app/bot";
import * as M from "@packages/discord-fp/Message";
import * as T from "fp-ts/Task";

import * as subscription from "./src/subscription";
import * as admin from "./src/admin";

command("!subscribe")
  .pipe(M.channelOnly)
  .subscribe(msg => {
    const pipeline = pipe(
      M.parse(msg), 
      M.nth(1), 
      O.fold (subscription.list, subscription.addTo(msg.member)),
      T.chain (M.replyTo(msg))
    );

    pipeline();
  });

command("!unsubscribe")
  .pipe(M.channelOnly)
  .subscribe(msg => {
    const pipeline = pipe(
      M.parse(msg), 
      M.nth(1), 
      O.fold (subscription.list, subscription.removeFrom(msg.member)),
      T.chain (M.replyTo(msg))
    );

    pipeline();
  });

command("!sub-admin")
  .pipe(M.channelOnly)
  .subscribe(admin.handle);