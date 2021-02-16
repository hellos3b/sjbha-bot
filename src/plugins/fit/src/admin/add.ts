import {Activity, MessageEmbedOptions, MessageOptions, User} from "discord.js";
import type {Message, Member} from "@packages/bastion";
import "../io/strava-client";
import * as R from "ramda";
import * as E from "fp-ts/Either";
import * as IO from "fp-ts/IO";
import * as TE from "fp-ts/TaskEither";
import {pipe, flow, constant} from "fp-ts/function";
import {embed, color, author, field} from "@packages/embed";

import * as UserDB from "../io/user-db";
import * as HistoryDB from "../io/history-db";
import * as Strava from "../io/strava-client";
import * as u from "../core/User";
import * as xp from "../core/Exp";
import * as h from "../core/History";
import * as time from "../core/Time";
import { InvalidArgs, NotFound } from "@packages/common-errors";
import { errorReporter } from "@app/bastion";

export async function adminAdd(req: Message) {
  const activityId = pipe(
    req.args.nth(2),
    TE.fromOption(InvalidArgs.lazy("Missing {id}"))
  );

  const pipeline = pipe(
    UserDB.fetchUserAsAuthorized({discordId: req.author.id}),
    TE.bindTo('user'),
    TE.bind('activityId', constant(activityId)),
    TE.bind('workout', ({user, activityId}) => Strava.fetchActivity(activityId)(user)),
    TE.map(data => {
      const [user, exp] = u.addWorkout(data.user)(data.workout);
      console.log(data.workout);
      console.log(user, exp);
      return "Added " + data.workout.title + " to your profile ( gained " + exp.value + "xp!)";
    })
  )

  const result = await pipeline();

  pipe(
    result,
    E.mapLeft(errorReporter(req)),
    E.map(req.channel.send)
  );
}