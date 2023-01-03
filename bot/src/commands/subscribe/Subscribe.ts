import { match, __ } from "ts-pattern";

import * as Command from "../../deprecating/Command";

import * as Commands from "./Commands";
import * as Admin from "./Admin";
import { env } from "../../environment";

const sub = Command.filtered ({
   filter:   Command.Filter.startsWith ("!subscribe"),
   callback: message => 
      match (Command.route (message))
         .with (__.nullish, () => Commands.list (message))
         .otherwise (() => Commands.subscribe (message))
});

const unsub = Command.filtered ({
   filter:   Command.Filter.startsWith ("!unsubscribe"),
   callback: Commands.unsubscribe
});

const admin = Command.filtered ({
   filter: Command.Filter.and (
      Command.Filter.startsWith ("$subscribe"),
      Command.Filter.inChannel (env.CHANNEL_BOT_ADMIN)
   ),

   callback: message => 
      match (Command.route (message))
         .with ("add", () => Admin.addSubscription (message))
         .with ("remove", () => Admin.removeSubscription (message))
         .otherwise (() => Admin.help (message))
});

export const subscribe = Command.combine (sub, unsub, admin);