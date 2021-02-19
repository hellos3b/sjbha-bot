import {sequenceT} from "fp-ts/Apply";
import * as TE from "fp-ts/TaskEither";
import {Do, bind, bindW, chainW, fromEither, chainFirstW, map, getOrElseW} from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import {pipe, flow} from "fp-ts/function";

import {command} from "@app/bastion";
import * as Error from "@packages/common-errors";

import * as u from "./src/models/User";
import * as w from "./src/models/Workout";
import * as lw from "./src/models/LoggedWorkout";

import * as profile from "./src/views/profile";
import * as activity from "./src/views/activity";

import {logWorkout} from "./src/app/add-workout";

const seqTE = sequenceT(TE.taskEither);

const root = command("fit");
const fit$ = root.subcommand;
const admin$ = root.subcommand;

fit$("profile")
  .subscribe(({ author, channel }) => pipe(
    Do,
      bind  ('user',     _ => u.fetchConnected(author.id)),
      bindW ('workouts', _ => lw.fetchLastDays(30, _.user)),
      map 
        (_ => profile.render(_.user, _.workouts)),
    getOrElseW 
      (commonErrorReplies),
    T.map 
      (channel.send)
  )());


admin$("add")
  .subscribe(({ args, author, channel }) => {
    const activityId = fromEither (args.nthE(2, "Invalid ID"));

    return pipe(
      Do,
        bind  ('user',       _ => u.fetchConnected(author.id)),
        bindW ('activityId', _ => activityId),
        bindW ('workout',    _ => w.fetch(_.activityId)(_.user.refreshToken)),
        bindW ('week',       _ => lw.fetchCurrentWeek(_.user)),
        map 
          (_ => {
            const [result, user] = logWorkout(_.workout, _.user);
            return {result, user, workout: _.workout, week: _.week};
          }),
        // chainFirstW
        //   (_ => seqTE(u.save(_.user), lw.insert(_.result))),
        map 
          (_ => activity.render(_.user, _.result, _.workout, _.week)),  
      getOrElseW 
        (commonErrorReplies),
      T.map 
        (channel.send)
    )();
  });


const commonErrorReplies = (err: Error) => { 
  switch (err.constructor) {
    case Error.NotFoundError:
    case u.NoRefreshTokenError:
      return T.of("You need to authorize with the bot first");

    case Error.HTTPError: {
      console.error(err.message);
      return T.of("Oops, seems like Strava might be down currently");
    }
    default: {
      console.error(err);
      return T.of("Something unexpected happened");
    }
  }
};