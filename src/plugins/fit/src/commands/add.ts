import type {Message} from "@packages/bastion";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { sequenceT } from "fp-ts/lib/Apply";
import {pipe} from "fp-ts/function";

import * as Error from "@packages/common-errors";
import {addWorkout} from "../app/add-workout";

import * as User from "../models/User";
import * as Workout from "../models/Workout";
import * as LoggedWorkout from "../models/LoggedWorkout";

export async function adminAdd(req: Message) {
  const activityId = req.args.nthE(2, "Invalid ID");

  const pipeline = pipe(
    TE.Do,
    TE.bind
      ('activityId', () => TE.fromEither(activityId)),
    TE.bind
      ('user', () => User.byId(req.author.id)),
    TE.bindW
      ('workout', ({user, activityId}) => Workout.fetch(activityId)(user.refreshToken)),
    TE.map
      (({user, workout}) => {
        const [result, usr] = addWorkout(workout)(user);
        return {workout, result, user: usr};
      }),
    TE.chainFirstW
      (res => sequenceT(TE.taskEither)(
        User.save(res.user),
        LoggedWorkout.insert(res.result)
      )),
    TE.map
      (_ => `Recorded '${_.workout.title}' with ${_.result.exp_gained} exp`)
  ); 

  const reply = await pipeline();

  pipe(
    reply,
    E.getOrElse(formatError),
    req.channel.send
  );
}

const formatError = (err: Error) => {
  switch (err.constructor) {
    case User.NoRefreshTokenError:
      return "You have to be authorized";
    case Error.InvalidArgsError:
      return err.message;
    case Error.HTTPError:
        return err.message;
    default: {
      console.error(err);
      return "Something unexpected happened";
    }
  }
}