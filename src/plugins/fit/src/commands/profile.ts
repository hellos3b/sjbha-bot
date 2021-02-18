import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import {pipe} from "fp-ts/function";

import type {Message, Member} from "@packages/bastion";
import { color, author, embed, field } from "@packages/embed";

import * as u from "../models/User";
import * as lw from "../models/LoggedWorkout";

export async function profile(req: Message) {
  const pipeline = pipe(
    TE.Do,
    TE.bindW
      ('user', () => u.byId(req.author.id)),
    TE.bindW
      ('workouts', ({user}) => lw.thirtyDayHistory(user)),
    TE.map
      (data => {
        console.log("Data?", data);
        return data;
      }),
    TE.map
      (({user, workouts}) => render(user, workouts))
  );

  const reply = await pipeline();

  pipe(reply, 
    E.fold(
      err => req.channel.send("an error occured"),
      req.channel.send
    )
  );
}

const render = (user: u.User, workouts: lw.LoggedWorkout[]) => embed(
  color(0x4ba7d1),

  author(user.discordId),

  field("Fit score", true)
    (pipe(u.fitScore(user), fs => `${fs.value} (${fs.rank})`)),

  field("Total EXP", true)
    (formatExp(user.xp)),

  field("Weekly EXP", true)
    (pipe(workouts, lw.filterThisWeek(), lw.sumExp, formatExp))
);

const formatExp = (xp: number) => 
  (xp > 1000) 
    ? (xp / 1000).toFixed(1) + "k"
    : xp.toFixed(0);

// import * as R from "ramda";
// import * as E from "fp-ts/Either";
// import * as IO from "fp-ts/IO";
// import * as TE from "fp-ts/TaskEither";
// import {pipe, flow} from "fp-ts/function";

// import {errorReporter} from "@app/bastion";

// import type {Message, Member} from "@packages/bastion";
// import * as Errors from "@packages/common-errors";
// import {embed, color, author, field} from "@packages/embed";

// import * as UserDB from "../io/user-db";
// import * as HistoryDB from "../io/history-db";
// import * as u from "../core/User";
// import * as xp from "../core/Exp";
// import * as h from "../core/History";
// import * as time from "../core/Time";

// export async function profile(req: Message) {
//   req.channel.send("hi");
// }
// // const expInterval = time.lastNDays(30);
// // const fetchExp = HistoryDB.fetchInterval(expInterval());

// // const weeklyExp = flow(
// //   // h.filterTime(time.isThisWeek),
// //   // h.toExp,
// //   xp.sum
// // );

// // const createEmbed = (history: h.History, user: u.FitUser) => embed([
// //   color(0x4ba7d1),
// //   author(user.member.name, user.member.avatar),
// //   field("Fit score", user.score, true),
// //   field("Total EXP", user.exp, true),
// //   field("Weekly EXP", weeklyExp(history), true)
// // ]);

// // export async function profile(req: Message) {
// //   const pipeline = pipe(
// //     UserDB.fetchAuthd({discordId: req.author.id}), 
// //     TE.bindTo('user'),
// //     TE.bind('history', _ => fetchExp({discordId: _.user.member.id})),
// //     TE.map(_ => createEmbed(_.history, _.user))
// //   );

// //   const result = await pipeline();

// //   pipe(
// //     result,
// //     Errors.match([
// //       [Errors.Unauthorized, "You are not connected"]
// //     ]),
// //     E.fold(errorReporter(req), req.channel.send)
// //   );
// // }

// // // Display an over view of stats 
// // export async function profile(message: Message) {
// //   const user = getUserById(message.author.id);

// //   const pipeline = pipe(
// //     TE.bindTo('user')(user),
// //     TE.bind(
// //       'member',
// //       ({user}) => TE.fromEither(user.member()),
// //     ),
// //     TE.bind(
// //       'activities', 
// //       ({user}) => recentActivities(user)
// //     ),
// //     TE.fold(
// //       err => T.of(errorResponse(err)),
// //       data => T.of(createEmbed(message.author, data.user, data.activities))
// //     )
// //   )

// //   pipeline()
// //     .then(message.channel.send)
// //     .catch(console.error);
// // }

// // const createEmbed = (props: {member: Member, activities: Activity[]}) => embed([
// //   color(0x4ba7d1),
// //   author(props.member.name, props.member.avatar),
// //   field("activity", props.activities[0].name)
// // ]);

// /** Combines user data with activities */
// // const withActivities = (user: User.PublicUser) => R.pipe(
// //   Activity.getLastMonth,
// //   F.map<Activity.Model[], EmbedProps> 
// //     (activities => ({user, activities}))
// // )(user)

// // const fetchProfileData = R.pipe(
// //   User.getAsPublicUser,
// //   F.chain (withActivities)
// // )

// // /****************************************************************
// //  *                                                              *
// //  * Embed                                                        *
// //  *                                                              *
// //  ****************************************************************/

// // interface EmbedProps {
// //   user: User.PublicUser,
// //   activities: Activity.Model[]
// // }

// // const createEmbed = ({user, activities}: EmbedProps): Embed => {
// //   const emojis = Activity.genderedEmoji (user.gender);
// //    const recent = recentActivity (emojis);

// //   return {
// //     color: 0x4ba7d1,

// //     author: {
// //       name    : user.displayName,
// //       icon_url: user.avatar
// //     },

// //     fields: [
// //       R.compose 
// //         (asField("Level"), User.level) 
// //         (user.xp),

// //       R.compose 
// //         (asField("EXP"), shortenNum) 
// //         (user.xp),

// //       R.compose (asField("Fit Score"), formatScore)
// //         (user.fitScore),

// //       R.compose
// //         (asField("Last Activity", false), recent)
// //         (Activity.mostRecent (activities)),

// //       R.compose
// //         (asField(`30 Day Totals *(${activities.length} Activities)*`), totals)
// //         (activities)
// //     ]
// //   }
// // };

// // const formatSummary = (summary: Activity.Summary) => format(
// //   '**{0}** • {1} activities ({2})',
// //     summary.type,
// //     String(summary.count),
// //     toTime(summary.totalTime)
// //   )
  
// // const formatScore = (score: number) => format(
// //   '{0} *({1})*',
// //   score.toFixed(0),
// //   User.rankName(score)
// // )

// // const formatRecentActivity = (emoji: string, activity: Activity.Model) => format(
// //   '{0} {1} *{2}*',
// //     emoji,
// //     activity.name,
// //     R.pipe (Activity.started, toRelative) (activity)
// //   )


// // /** Summarizes individual activity types */
// // const summarizeTypes = R.pipe(
// //   Activity.groupByType,
// //   R.mapObjIndexed (Activity.summary),
// //   Object.values
// // );

// // /** Display totals of each workout type, along with count + time */
// // const totals = R.pipe(
// //   summarizeTypes,
// //   FP.sortByProp ("count", 1),
// //   R.map (formatSummary),
// //   R.join ("\n")
// // )

// // const recentActivity = (emojis: Activity.GenderedEmojis) => (activity: Maybe<Activity.Model>) => 
// //   activity
// //     .map (data => formatRecentActivity (emojis(data.type), data))
// //     .orDefault ("*No activities in last 30 days*")


