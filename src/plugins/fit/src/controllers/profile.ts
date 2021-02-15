import {Activity, MessageEmbedOptions, MessageOptions} from "discord.js";
import type {Message, Member} from "@packages/bastion";
import "../io/strava-client";
import * as R from "ramda";
import * as UserDB from "../io/user-db";
import * as Strava from "../io/strava-client";
import * as User from "../core/User";
import * as xp from "../core/Exp";

import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import {pipe, flow} from "fp-ts/function";

import {embed, color, author, field} from "@packages/embed";
import { Workout } from "../core/Workout";

const fetchUser = flow(UserDB.fetchUser, TE.chainEitherK(User.asAuthorized));
const fetchWorkouts = Strava.fetchWorkouts({});

const profileData = flow(
  fetchUser, TE.bindTo('user'),
  TE.bind('workouts', _ => fetchWorkouts(_.user))
);

const createEmbed = (activities: Workout[], user: User.FitUser) => embed([
  color(0x4ba7d1),
  author(user.member.name, user.member.avatar),
  field("EXP", user.exp, true),
  field("Fit score", user.score, true)
]);

export async function profile(req: Message) {
  const pipeline = pipe(
    profileData({discordId: req.author.id}),
    TE.map(_ => createEmbed(_.workouts, _.user)),
    TE.map(req.channel.send)
  )

  return pipeline()
    .then(E.mapLeft((error: Error) => {
      console.error(error);
    }));
}

// // Display an over view of stats 
// export async function profile(message: Message) {
//   const user = getUserById(message.author.id);

//   const pipeline = pipe(
//     TE.bindTo('user')(user),
//     TE.bind(
//       'member',
//       ({user}) => TE.fromEither(user.member()),
//     ),
//     TE.bind(
//       'activities', 
//       ({user}) => recentActivities(user)
//     ),
//     TE.fold(
//       err => T.of(errorResponse(err)),
//       data => T.of(createEmbed(message.author, data.user, data.activities))
//     )
//   )

//   pipeline()
//     .then(message.channel.send)
//     .catch(console.error);
// }

// const createEmbed = (props: {member: Member, activities: Activity[]}) => embed([
//   color(0x4ba7d1),
//   author(props.member.name, props.member.avatar),
//   field("activity", props.activities[0].name)
// ]);

/** Combines user data with activities */
// const withActivities = (user: User.PublicUser) => R.pipe(
//   Activity.getLastMonth,
//   F.map<Activity.Model[], EmbedProps> 
//     (activities => ({user, activities}))
// )(user)

// const fetchProfileData = R.pipe(
//   User.getAsPublicUser,
//   F.chain (withActivities)
// )

// /****************************************************************
//  *                                                              *
//  * Embed                                                        *
//  *                                                              *
//  ****************************************************************/

// interface EmbedProps {
//   user: User.PublicUser,
//   activities: Activity.Model[]
// }

// const createEmbed = ({user, activities}: EmbedProps): Embed => {
//   const emojis = Activity.genderedEmoji (user.gender);
//    const recent = recentActivity (emojis);

//   return {
//     color: 0x4ba7d1,

//     author: {
//       name    : user.displayName,
//       icon_url: user.avatar
//     },

//     fields: [
//       R.compose 
//         (asField("Level"), User.level) 
//         (user.xp),

//       R.compose 
//         (asField("EXP"), shortenNum) 
//         (user.xp),

//       R.compose (asField("Fit Score"), formatScore)
//         (user.fitScore),

//       R.compose
//         (asField("Last Activity", false), recent)
//         (Activity.mostRecent (activities)),

//       R.compose
//         (asField(`30 Day Totals *(${activities.length} Activities)*`), totals)
//         (activities)
//     ]
//   }
// };

// const formatSummary = (summary: Activity.Summary) => format(
//   '**{0}** • {1} activities ({2})',
//     summary.type,
//     String(summary.count),
//     toTime(summary.totalTime)
//   )
  
// const formatScore = (score: number) => format(
//   '{0} *({1})*',
//   score.toFixed(0),
//   User.rankName(score)
// )

// const formatRecentActivity = (emoji: string, activity: Activity.Model) => format(
//   '{0} {1} *{2}*',
//     emoji,
//     activity.name,
//     R.pipe (Activity.started, toRelative) (activity)
//   )


// /** Summarizes individual activity types */
// const summarizeTypes = R.pipe(
//   Activity.groupByType,
//   R.mapObjIndexed (Activity.summary),
//   Object.values
// );

// /** Display totals of each workout type, along with count + time */
// const totals = R.pipe(
//   summarizeTypes,
//   FP.sortByProp ("count", 1),
//   R.map (formatSummary),
//   R.join ("\n")
// )

// const recentActivity = (emojis: Activity.GenderedEmojis) => (activity: Maybe<Activity.Model>) => 
//   activity
//     .map (data => formatRecentActivity (emojis(data.type), data))
//     .orDefault ("*No activities in last 30 days*")


