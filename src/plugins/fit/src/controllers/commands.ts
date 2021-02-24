import {sequenceS} from "fp-ts/Apply";
import {chainW, Do, bind, fromEither, bindW, chainFirstW, mapLeft, map, chainEitherKW} from "fp-ts/TaskEither";
import {flow, pipe} from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";

import {code} from "@packages/embed";
import * as M from "@packages/discord-fp/Message";
import * as Error from "@packages/common-errors";
import {message$, broadcast} from "@app/bot";
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

const base = message$.pipe(M.startsWith("!fit"));
/** Commands used in the #fitness channel */
const fit_ = base.pipe(M.channel, M.restrict(channels.strava));
/** Commands used privately in DMs, such as editing your profile */
const fit_dm_ = base.pipe(M.direct);
/** Admin-only commands, so don't have to hit a POST url to do everything */
const fit_admin_ = base.pipe(M.restrict(channels.bot_admin));

fit_.subscribe(msg => {
  const route = M.route(msg);

  const action = 
    (route === "auth") ? Auth(msg)
    : (route === "profile") ? Profile(msg)
    : (route === "scores") ? Scores(msg)
    : Help(msg);

  const run = pipe(
    action,
    mapLeft (
      flow(commonErrorReplies, M.replyTo(msg))
    )
  );

  return run();
});

fit_dm_.subscribe(msg => {
  const route = M.route(msg);

  const Usage = M.reply([
    "!fit set [property] [value]",
    "!fit get [property]"
  ].join("\n"));

  const action = 
    (route === "set") ? UpdateProfile(msg)
    : (route === "get") ? GetProfileSetting(msg)
    : Usage(msg);

  const run = pipe(
    action,
    mapLeft (
      flow(commonErrorReplies, M.replyTo(msg))
    )
  );

  return run();
});

fit_admin_.subscribe(msg => {
  const route = M.route(msg);

  const action = 
    (route === "promote") ? RunPromotions(msg)
    : (route === "recent") ? ListRecentWorkouts(msg)
    : (route === "post") ? ManuallyPostActivity(msg)
    : AdminHelp(msg);

  const run = pipe(
    action,
    mapLeft(
      flow(
        err => err.name + ": " + err.message, 
        M.replyTo(msg)
      )
    )
  );

  return run();
});

/**
 * The help command
 */
const Help = M.reply(`
\`\`\`
**Read up on how the fitness bot works:** <https://github.com/hellos3b/sjbha-bot/blob/ts-fit/src/plugins/fit/README.md>

!fit auth        • Connect your strava account to the bot
!fit profile     • View your profile stats like level, fit score, activity overview
!fit scores      • View everyone's current ranking
\`\`\`
`);

/**
 * Authorize their strava account with the bot.
 * DM's the user an authorization url so they can start an OAuth flow
 */
const Auth = (msg: M.ChannelMessage) => pipe(
  auth.updateOrCreatePassword(msg.author.id),
  map (url => {
    const intro = 
      `**Welcome to the fitness channel!**\n`
      + `\n`
      + `Click here to authorize the bot: ${url}\n`
      + `If you don't have a Strava Account: <https://www.strava.com/>`
      + `For information on how the bot works: ${env.host_name}/fit/help`;

    msg.member.send(intro);
    return "Hello! I've DM'd you instructions on how to connect your account";
  }),
  chainW (M.replyTo(msg))
);

/**
 * Fetches the last 30 days of activities and displays a small profile embed
 */
const Profile = (msg: M.ChannelMessage) => pipe(
  Do,
    bind  ('user',     _ => u.fetchConnected(msg.author.id)),
    bindW ('workouts', _ => lw.fetchLastDays(30, _.user)),
    map (_ => profile.render(_.user, _.workouts)),
    chainW (M.replyTo(msg))
);
  
/**
 * Kind of like a high score table but fit score based
 * But it's not a competition !
 */
const Scores = (msg: M.ChannelMessage) => pipe(
  u.getAll(),
  map (scores.render),
  chainW (M.replyTo(msg))
)

/**
 * Let's a user update their private profile settings,
 * such as their max heartrate or their (//todo) gender
 */
const UpdateProfile = (msg: M.DirectMessage) => {
  const params = sequenceS(E.either)({
    prop: M.nthE(2, "Usage: `!fit set [property] [value]`")(msg),
    value: M.nthE(3, "Usage: `!fit set [property] [value]`")(msg)
  });

  return pipe(
    Do,
      bindW ('user', () => u.fetch(msg.author.id)),
      bindW ('params', () => fromEither(params)),
      chainEitherKW (({ params, user }) => edit.set(params.prop, params.value)(user)),
      chainFirstW (user => u.save(user)),
      map (() => `Your profile has been updated!`),
      chainW (M.replyTo(msg))
  );
};

/**
 * Let's a user check what a certain profile setting is currently set to
 */
const GetProfileSetting = (msg: M.DirectMessage) => { 
  const prop = M.nthE(2, "Usage: `!fit get [property]`")(msg);

  return pipe(
    Do,
      bindW ('user', () => u.fetch(msg.author.id)),
      bindW ('prop', () => fromEither(prop)),
      chainEitherKW (({ user, prop }) => edit.get(prop)(user)),
      chainW (M.replyTo(msg))
  );
};

/**
 * Help block for admin commands
 */
const AdminHelp = M.reply(`
Admin Fit commands:
\`!fit promote\` Runs the weekly promotions (usefulf or testing, or if it week borked)
\`!fit recent\` - list the recent workouts and ids (in case you want to delete one)
\`!fit post [stravaId] [activityId] --broadcast(?)\` - Manually post an activity. Pass in \`--broadcast\` if you want it posted in the strava channel instead of just replied
`)

/**
 * Force runs the weekly promotions.
 * Not recommended for production
 */
const RunPromotions = (msg: M.Message) => {
  promote.run();
  return M.reply(`Promotions job began`)(msg);
}

/**
 * Lists all the recently recorded workouts and their IDs
 */
const ListRecentWorkouts = (msg: M.Message) => {
  const pad = (value: any) => value.toString().padEnd(16);

  const format = (w: lw.LoggedWorkout) =>
    pad(w.activity_id) + pad(w.exp_gained.toFixed(1)) + pad(w.activity_name);

  return pipe(
    lw.recent(),
    map (w => {
      const rows = w.map(format);
      return code()(rows.join("\n"))
    }),
    chainW (M.replyTo(msg))
  );
}

/**
 * If a workout gets stuck in limbo, you can manually force it to post
 */
const ManuallyPostActivity = (msg: M.Message) => {
  const params = sequenceS(E.either)({
    stravaId: M.nthE(2, "Missing strava ID. Command: `!fit post {stravaId} {activityId}`")(msg),
    activityId: M.nthE(3, "Missing activity ID. Command: `!fit post {stravaId} {activityId}`")(msg)
  });

  const send = pipe(
    M.get("broadcast")(msg),
    O.fold(() => broadcast(channels.strava), () => M.replyTo(msg))
  );

  return pipe(
    Do,
      bind  ('params',   _ => fromEither(params)),
      chainW (({ params }) => addWorkout.save(params.stravaId, params.activityId)),
      map  (_ => activity.render(_.user, _.result, _.workout, _.week)),
      chainW (send)
  );
}

/**
 * 
 */
const commonErrorReplies = (err: Error) => { 
  switch (err.constructor) {
    case Error.InvalidArgsError:
      return err.message;

    case Error.NotFoundError:
    case u.NoRefreshTokenError:
      return "You need to authorize with the bot first! Use `!fit auth` to get started";

    case Error.HTTPError: {
      console.error(err.message);
      return "Couldn't finish your request, something is wrong with Strava";
    }

    default: {
      console.error(err);
      return "Something unexpected happened, this error has been logged";
    }
  }
};