import {MessageEmbedOptions, MessageOptions} from "discord.js";
import type {Message} from "@packages/bastion";
import "./strava/client";
import * as R from "ramda";
// import * as F from "fluture";
// import * as FP from "../../utils/fp-utils";
// import * as User from "../../models-old/user";
// import * as Activity from "../../models-old/activity";

// import { asField, Embed } from "@shared/bastion/fp";
// import {handleError} from "../../utils/errors";

import format from 'string-format';
import {
  either as E,
  taskEither as TE,
  task as T
} from "fp-ts";
import {pipe, flow} from "fp-ts/function";

import {embed, color, author, field} from "@packages/embed";

import {UserDTO, loadUser} from "./db/db-user";
import { getActivites } from "./strava/client";
import { Activity } from "./strava/responses";
import { errorResponse } from "./errors";

const recentActivities = getActivites({});
const fold = flow(E.fold, T.map);

// Display an over view of stats 
export async function profile(message: Message) {
  const pipeline = pipe(
    TE.bindTo('user')(loadUser({discordId: message.author.id})),
    TE.bind('activities', ({user}) => recentActivities(user)),
    fold(
      errorResponse, 
      data => createEmbed(data.user, data.activities)
    )
  )

  pipeline()
    .then(message.channel.send)
    .catch(console.error);
}

const createEmbed = (user: UserDTO, activities: Activity[]) => embed([
  color(0x4ba7d1),
  author(user.discordId, "https://cdn.discordapp.com/embed/avatars/0.png"),
  field("activity", activities[0].name)
]);

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
//   const recent = recentActivity (emojis);

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


