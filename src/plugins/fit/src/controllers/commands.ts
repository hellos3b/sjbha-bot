import * as R from "ramda";
import {sequenceS} from "fp-ts/Apply";
import {chainW, Do, bind, fromEither, bindW, chainFirstW, map, chainEitherKW, orElse} from "fp-ts/TaskEither";
import {flow, pipe} from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";

import logger from "@packages/logger";
import {code} from "@packages/embed";
import * as M from "@packages/discord-fp/Message";
import * as Error from "@packages/common-errors";
import {message$, broadcast, reportError} from "@app/bot";
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
import * as leaders from "../views/leaders";
import * as balance from "../views/balance";

const log = logger("fit");

const base = message$.pipe(M.trigger("!fit"));
/** Commands used in the #fitness channel */
const fit_ = base.pipe(M.channelOnly, M.restrict(channels.strava, channels.bot_admin));
/** Commands used privately in DMs, such as editing your profile */
const fit_dm_ = base.pipe(M.directOnly);
/** Admin-only commands, so don't have to hit a POST url to do everything */
const fit_admin_ = base.pipe(M.restrict(channels.bot_admin));

fit_.subscribe(msg => {
  log.debug({user: msg.author.username, message: msg.content});
  const route = M.route(msg);

  const action = 
    (route === "auth") ? Auth(msg)
    : (route === "profile") ? Profile(msg)
    : (route === "scores") ? Scores(msg)
    : (route === "leaders") ? Leaders(msg)
    : (route === "balance") ? Balance(msg)
    : (route === "leaderboard") ? M.reply("Command has changed to `!fit scores`")(msg)
    : (route === "exp") ? M.reply("You can now see your weekly exp in your profile, use `!fit profile`")(msg)
    : Help(msg);

  const run = pipe(
    action,
    orElse(
      flow(commonErrorReplies, M.replyTo(msg))
    )
  );

  return run();
});

fit_dm_.subscribe(msg => {
  log.debug({user: msg.author.username, message: msg.content, router: "fit_dm"});
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
    orElse(
      flow(commonErrorReplies, M.replyTo(msg))
    )
  );

  return run();
});

fit_admin_.subscribe(msg => {
  log.debug({user: msg.author.username, message: msg.content, router: "fit_admin"});
  const route = M.route(msg);

  const action = 
    (route === "promote") ? RunPromotions(msg)
    : (route === "recent") ? ListRecentWorkouts(msg)
    : (route === "post") ? ManuallyPostActivity(msg)
    : (route === "rm") ? RemoveActivity(msg)
    : AdminHelp(msg);

  const run = pipe(
    action,
    orElse(
      flow(
        err => {
          switch (err.constructor) {
            case Error.NotFoundError:
            case Error.InvalidArgsError:
            case Error.ConflictError:
              return err.message;
            default: {
              reportError(msg)(err);
              return err.toString();
            }
          }
        },
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
**Read up on how the fitness bot works:** <https://github.com/hellos3b/sjbha-bot/blob/ts-fit/src/plugins/fit/README.md>

\`\`\`
!fit auth        • Connect your strava account to the bot
!fit profile     • View your profile stats like level, fit score, activity overview
!fit scores      • View everyone's current ranking
!fit leaders     • Show the top 2 leaders for each activity type
!fit balance     • Small analysis on your EXP types (hr activities only)
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
    bindW ('workouts', _ => lw.fetchLastDays(30)({discord_id: _.user.discordId})),
    map (_ => profile.render(_.user, _.workouts)),
    chainW (M.replyTo(msg))
);
  
/**
 * Kind of like a high score table but fit score based
 * But it's not a competition !
 */
const Scores = (msg: M.ChannelMessage) => pipe(
  u.getAllAsAuthorized(),
  map (users => users.filter(_ => _.fitScore > 0)),
  map (scores.render),
  chainW (M.replyTo(msg))
)

const Leaders = (msg: M.ChannelMessage) => pipe(
  Do,
    // bindW('users', () => u.getAllAsAuthorized()),
    bindW('workouts', () => lw.fetchLastDays(30)({})),
    map (_ => {
      const hrWorkouts = _.workouts.filter(w => w.exp_type === "hr");
      return leaders.render([], hrWorkouts);
    }),
    chainW (M.replyTo(msg))
);

const Balance = (msg: M.ChannelMessage) => pipe(
  lw.fetchLastDays(14)({discord_id: msg.author.id}),
  map (workouts => workouts.filter(_ => _.exp_type === 'hr')),
  map (workouts => workouts.length < 4
      ? "You need at least **4** heartrate workouts in the last 2 weeks to check your balance"
      : balance.render(workouts)
  ),
  chainW (M.replyTo(msg))
);

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
\`!fit rm [activityId]\` - Remove an activity
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
  log.debug({content: msg.content}, "Manually posting activity");

  const params = sequenceS(E.either)({
    stravaId: M.nthE(2, "Missing strava ID. Command: `!fit post {stravaId} {activityId}`")(msg),
    activityId: M.nthE(3, "Missing activity ID. Command: `!fit post {stravaId} {activityId}`")(msg)
  });

  const send = pipe(
    M.get("broadcast")(msg),
    O.fold(() => M.replyTo(msg), () => broadcast(channels.strava))
  );

  return pipe(
    Do,
      bind  ('params',   _ => fromEither(params)),
      chainW (({ params }) => addWorkout.save(+params.stravaId, +params.activityId)),
      map  (_ => activity.render(_.user, _.result, _.workout, _.week)),
      chainW (send)
  );
}

/**
 * Removes a workout from the database and un-does the EXP from the user
 */
const RemoveActivity = (msg: M.Message) => {
  const id = M.nthE(2, "Missing ID: `!fit-admin rm {ID}`")(msg);

  return pipe(
    fromEither(id),
    chainW (id => addWorkout.unsave(+id)),
    map (({ workout }) => `Removed '${workout.activity_name}' from logged history`),
    chainW (M.replyTo(msg))
  );
}

/**
 * 
 */
const commonErrorReplies = (err: Error) => { 
  log.debug({type: err.toString()}, "Handling fit error");

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