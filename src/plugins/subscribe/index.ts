import channels from "@app/channels";
import * as O from "fp-ts/Option";
import {pipe, flow} from "fp-ts/function";

import {message$} from "@app/bot";
import * as M from "@packages/discord-fp/Message";
import * as T from "fp-ts/Task";

import * as subscription from "./src/subscription";
import * as admin from "./src/admin";

message$.pipe(
  M.trigger("!subscribe"), 
  M.channel
).subscribe(msg => {
  const pipeline = pipe(
    M.parse(msg), 
    M.nth(1), 
    O.fold (subscription.list, subscription.addTo(msg.member)),
    T.chain (M.replyTo(msg))
  );

  pipeline();
});

message$.pipe(
  M.trigger("!unsubscribe"), 
  M.channel
).subscribe(msg => {
  const pipeline = pipe(
    M.parse(msg), 
    M.nth(1), 
    O.fold (subscription.list, subscription.removeFrom(msg.member)),
    T.chain (M.replyTo(msg))
  );

  pipeline();
});

message$.pipe(
  M.trigger("!sub-admin"), 
  M.channel
).subscribe(admin.handle);