import {Activity, MessageEmbedOptions, MessageOptions} from "discord.js";
import type {Message, Member} from "@packages/bastion";
import "../io/strava-client";
import * as R from "ramda";
import * as E from "fp-ts/Either";
import * as IO from "fp-ts/IO";
import * as TE from "fp-ts/TaskEither";
import {pipe, flow} from "fp-ts/function";
import {embed, color, author, field} from "@packages/embed";

import * as UserDB from "../io/user-db";
import * as HistoryDB from "../io/history-db";
import * as Strava from "../io/strava-client";
import * as u from "../core/User";
import * as xp from "../core/Exp";
import * as h from "../core/History";
import * as time from "../core/Time";
import { NotFound } from "@packages/common-errors";

export async function adminAdd(req: Message) {
  const id = req.args.nth(2);

  const pipeline = pipe(
    id,
    TE.fromOption(NotFound.lazy("User '" + id +"' not authorized")),
    TE.chain(discordId => UserDB.fetchUserAsAuthorized({discordId})),
  )

  req.channel.send("id: " + id);
}