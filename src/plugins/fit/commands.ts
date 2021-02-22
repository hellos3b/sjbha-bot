import { sequenceT} from "fp-ts/Apply";
import {taskEither, Do, bind, bindW, chainFirstW, fromEither, mapLeft, map, getOrElseW, sequenceArray} from "fp-ts/TaskEither";
import {pipe} from "fp-ts/function";
import * as T from "fp-ts/Task";


import {command} from "@app/bastion";
import * as Error from "@packages/common-errors";

import * as u from "./models/User";
import * as w from "./models/Workout";
import * as lw from "./models/LoggedWorkout";
import * as Week from "./models/Week";

import * as env from "./env";
import {logWorkout} from "./app/add-workout";
import * as auth from "./app/authentication";
import * as promote from "./app/promote";

import * as profile from "./views/profile";
import * as activity from "./views/activity";

const seqTE = sequenceT(taskEither);

const root = command("fit");
const fit_ = root.subcommand;
const fit_admin_ = root.subcommand;

fit_("auth")
  .subscribe(({ author, channel }) => pipe(
    auth.updateOrCreatePassword(author.id),
    map 
      (url => `**Welcome to the fitness channel!**\n`
        + `\n`
        + `Click here to authorize the bot: ${url}\n`
        + `If you don't have a Strava Account: <https://www.strava.com/>`
        + `For information on how the bot works: ${env.host_name}/fit/help`),
    map
      (msg => {
        author.send(msg);
        channel.send("Hello! I've DM'd you instructions on how to connect your account");
      }),
    mapLeft
      (err => {
        channel.send("Something messed up when trying to initialize");
      })
  )());


fit_("profile")
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


fit_admin_("promotions")
  .subscribe(promote.run);


fit_admin_("post")
  .subscribe(({ args, author, channel }) => {
    // todo: maybe make this a parser hmmm
    const stravaId = fromEither (args.nthE(2, "Missing strava ID. Command: `!fit post {stravaId} {activityId}`"));
    const activityId = fromEither (args.nthE(3, "Missing activity ID. Command: `!fit post {stravaId} {activityId}`"));

    return pipe(
      Do,
        bind  ('stravaId',   _ => stravaId),
        bindW ('activityId', _ => activityId),
        bindW ('user',       _ => u.fetchByStravaId(_.stravaId)),
        bindW ('workout',    _ => w.fetch(_.activityId)(_.user.refreshToken)),
        bindW ('week',       _ => lw.find(Week.current())({discordId: _.user})),
        map 
          (_ => {
            const [result, user] = logWorkout(_.workout, _.user);
            return {result, user, workout: _.workout, week: _.week};
          }),
        // Insert the logged result first in case an error happens
        chainFirstW
          (_ => lw.insert(_.result)),
        chainFirstW
          (_ => u.save(_.user)),
        map 
          (_ => activity.render(_.user, _.result, _.workout, _.week)),  
      getOrElseW 
        (replyFullError),
      T.map 
        (channel.send)
    )();
  });

const replyFullError = (err: Error) => T.of(err.name + ": " + err.message);

const commonErrorReplies = (err: Error) => { 
  switch (err.constructor) {
    case Error.InvalidArgsError:
      return T.of(err.message);

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