import {sequenceT} from "fp-ts/Apply";
import {chainW, Do, bind, bindW, chainFirstW, fromEither, mapLeft, map, getOrElseW} from "fp-ts/TaskEither";
import {pipe} from "fp-ts/function";
import * as T from "fp-ts/Task";
import * as E from "fp-ts/Either";

import {command} from "@app/bastion";
import * as Error from "@packages/common-errors";
import channels from "@app/channels";

import * as u from "../models/User";
import * as lw from "../models/LoggedWorkout";

import * as env from "../../env";
import * as addWorkout from "../app/add-workout";
import * as auth from "../app/authentication";
import * as promote from "../app/promote";
import * as edit from "../app/edit-profile";

import * as profile from "../views/profile";
import * as activity from "../views/activity";
import * as scores from "../views/scores";

const root = command("fit");
const fit_ = root.subcommand;
const fit_dm_ = root.dm().subcommand;
const fit_admin_ = root.restrict(channels.bot_admin).subcommand;

// This link will probably answer most of your questions: 
// <${helpLink}>

const help = `
\`\`\`
!fit auth        • Connect your strava account to the bot
!fit profile     • View your profile stats like level, fit score, activity overview
!fit leaderboard • View all users by fit score
\`\`\`
`;

root
  .alone()
  .subscribe(({ channel }) => channel.send(help));

fit_("help")
  .subscribe(({ channel }) => channel.send(help));

// Set up your strava account with the bot
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
        channel.send("Failed to setup your account, something went wrong");
      })
  )());

// View your current profile
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

fit_("test").subscribe(({ channel }) => channel.send("success"));
  
fit_("scores")
  .subscribe(({ channel }) => pipe(
    u.getAll(),
    map (scores.render),
    getOrElseW 
      (commonErrorReplies),
    T.map 
      (channel.send)
  )());

// Update user properties
fit_dm_("set")
  .subscribe(({ args, author, channel }) => {
    const setProp = pipe(
      sequenceT(E.either)(
        args.nthE(2, "Usage: `!fit set [property] [value]`"),
        args.nthE(3, "Usage: `!fit set [property] [value]`")
      ),
      E.chain(props => edit.edit(...props)),
      fromEither
    );

    return pipe(
      u.fetch(author.id),
      chainW
        (user => pipe(setProp, map (fn => fn(user)))),
      chainFirstW
        (user => u.save(user)),
      map
        (user => `Your profile has been updated!`),
      getOrElseW
        (commonErrorReplies),
      T.map
        (channel.send)
    )();
  });

// Update 
fit_dm_("get")
  .subscribe(({ args, author, channel }) => {
    const getProp = pipe(
      args.nthE(2, "Usage: `!fit get [property]`"),
      E.chain(prop => edit.get(prop)),
      fromEither
    );

    return pipe(
      u.fetch(author.id),
      chainW
        (user => pipe(getProp, map (fn => fn(user)))),
      getOrElseW
        (commonErrorReplies),
      T.map
        (channel.send)
    )();
  });

// Manually trigger the weekly promotions
fit_admin_("promotions")
  .subscribe(promote.run);

// list all the recently recorded activities
fit_admin_("list")
  .subscribe(({ channel}) => pipe(
    lw.recent(),
    map
      (workouts => workouts.map(w => [
          String(w.activity_id).padEnd(14),
          `(${w.exp_gained.toFixed(1)})`.padEnd(8),
          w.activity_name
        ].join(" ")
      )),
    map
      (lines => "```" + lines.join("\n") + "```"),
    getOrElseW 
      (replyFullError),
    T.map 
      (channel.send)
  )());

// Manually submit an activity
fit_admin_("post")
  .subscribe(({ args, author, channel }) => {
    // todo: maybe make this a parser hmmm
    const stravaId = fromEither (args.nthE(2, "Missing strava ID. Command: `!fit post {stravaId} {activityId}`"));
    const activityId = fromEither (args.nthE(3, "Missing activity ID. Command: `!fit post {stravaId} {activityId}`"));

    return pipe(
      Do,
        bind  ('stravaId',   _ => stravaId),
        bindW ('activityId', _ => activityId),
        chainW
          (({ stravaId, activityId }) => addWorkout.post(stravaId, activityId)),
        map 
          (_ => activity.render(_.user, _.result, _.workout, _.week)),  
      getOrElseW 
        (replyFullError),
      T.map 
        (channel.send)
    )();
  });

/**
 * Replies the contents of the raw error message. Useful for private admin commands
 */
const replyFullError = (err: Error) => T.of(err.name + ": " + err.message);

/**
 * 
 */
const commonErrorReplies = (err: Error) => { 
  switch (err.constructor) {
    case Error.InvalidArgsError:
      return T.of(err.message);

    case Error.NotFoundError:
    case u.NoRefreshTokenError:
      return T.of("You need to authorize with the bot first! Use `!fit auth` to get started");

    case Error.HTTPError: {
      console.error(err.message);
      return T.of("Oops, there was an issue getting data from Strava");
    }

    default: {
      console.error(err);
      return T.of("Something unexpected happened");
    }
  }
};