import channels from "@app/channels";
import * as O from "fp-ts/Option";
import {pipe, flow} from "fp-ts/function";

import {message$} from "@app/bot";
import * as M from "@packages/discord-fp/Message";

import * as subscription from "./src/subscription";
import * as admin from "./src/admin";

message$.pipe(
  M.startsWith("!subscribe"), 
  M.channel
).subscribe(msg => {
  const pipeline = pipe(
    M.parse(msg), 
    M.nth(1), 
    O.fold (subscription.list, subscription.addTo(msg.member)) 
  );

  return pipeline().then(M.replyTo(msg));
});

message$.pipe(
  M.startsWith("!unsubscribe"), 
  M.channel
).subscribe(msg => {
  const pipeline = pipe(
    M.parse(msg), 
    M.nth(1), 
    O.fold (subscription.list, subscription.addTo(msg.member)) 
  );

  return pipeline()
    .then(M.replyTo(msg));  
});

message$.pipe(
  M.startsWith("!sub-admin"), 
  M.channel, 
  M.restrict(channels.bot_admin)
).subscribe(admin.handle);