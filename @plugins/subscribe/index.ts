import channels from "@app/channels";
import {Request} from "@services/bastion";
import {message$, cmd, noParam, param, restrict} from "@services/bastion/stream";
import { filter, share } from "rxjs/operators";

import * as subscription from "./src/subscription";
import * as admin from "./src/admin";

const hasParam = filter<Request>(req => !!req.args.length);

// Subscribe!
const subscribe$ = message$.pipe(cmd("subscribe"));

subscribe$.pipe(hasParam)
  .subscribe(subscription.add);

subscribe$.pipe(noParam())
  .subscribe(subscription.list);

// Unsubscribe :()
const unsubscribe$ = message$.pipe(cmd("unsubscribe"));

unsubscribe$.pipe(hasParam)
  .subscribe(subscription.remove);

unsubscribe$.pipe(noParam())
  .subscribe(subscription.list);

// Admin commands
const admin$ = message$.pipe(
  cmd("subscribe-admin"),
  restrict(channels.bot_admin)
);

admin$.pipe(noParam())
  .subscribe(admin.help);

admin$.pipe(param("help"))
  .subscribe(admin.help);

admin$.pipe(param("list"))
  .subscribe(admin.list);

admin$.pipe(param("add"))
  .subscribe(admin.add);

admin$.pipe(param("rm"))
  .subscribe(admin.remove);