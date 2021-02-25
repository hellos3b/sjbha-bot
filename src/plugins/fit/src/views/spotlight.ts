import * as R from "ramda";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";
import * as L from "luxon";
import {pipe, flow} from "fp-ts/function";
import format from "@packages/string-format";
import { author, color, description, embed, EmbedReader, field, thumbnail, title } from "@packages/embed";

import * as u from "../models/User";
import * as lw from "../models/LoggedWorkout";
import {Promotion} from "../app/promote";

const swole_doge = "https://imgur.com/lUCIFkk.png";
const exp_highlight_count = 2;

// todo: this doesn't work with 0 HR logs
export const render = (week: L.Interval, promotions: Promotion[], logs: lw.LoggedWorkout[]) => {
  // We're only gonna use HR logs for the exp spotlights
  const hrLogs = logs.filter(log => log.exp_type === "hr");
  const stats = promotions.map (([user]) => getStats(user, hrLogs.filter(_ => _.discord_id === user.discordId)));

  return embed(
    color(0xff0000),
    thumbnail(swole_doge),

    author(week.toFormat("MMM dd")),
    
    title("💡 Weekly Spotlight"),

    // show 2 random exp highlights
    ...pipe(
      createSpotlights(stats),
      shuffle,
      arr => arr.slice(0, exp_highlight_count)
    ),

    // and display a random activity
    pipe(
      logs.map(_ => _.activity_type),
      R.filter(_ => _ !== "Workout"),
      flow(R.uniq,  shuffle),
      A.head, 
      flow(
        O.chain(type => activityLeader(type, stats)),
        O.toNullable
      )
    ),

    // show every user's change
    progress(promotions)
  );
};

/**
 * Lists out all promotions / demotions that happened in this week
 */
const progress = (promotions: Promotion[]) => {
  const formatPromotion = ([user, change]: Promotion) => {
    // get up or down doot emoji
    const emoji = (user.fitScore === 100) 
      ? "🔹" : (change > 0) 
        ? "⬆️" : "🔻";// "⬇️";
        
    // add a plus sign if change is positive
    const diff = (change < 0) ? `(${change.toFixed(1)})` : "";
  
    return format("{0} **{1}** {2} {3}")(emoji, u.rank(user), user.name, diff);
  }

  const text = promotions
    .sort((a, b) => a[0].fitScore > b[0].fitScore ? -1 : 1)
    .map(formatPromotion)
    .join("\n");

  return field("Progress")(text);
}

/**
 * Parse a user's logs and group together some stats about them
 */
const getStats = (user: u.User, logs: lw.LoggedWorkout[]) => ({
  user, 
  logs,
  total_exp: lw.sumExp(logs),
  total_moderate: pipe(
    logs.map(log => log.exp_gained - log.exp_vigorous),
    R.sum
  ),
  total_vigorous: pipe(
    logs.map(log => log.exp_vigorous),
    R.sum
  ),
  deviation: pipe(
    logs.map(l => l.exp_gained), 
    deviation
  ),
  biggestActivity: pipe(
    most(logs)(s => s.exp_gained),
    O.toNullable
  )
});

type Stats = ReturnType<typeof getStats>;

/**
 * Create the possible exp-based fields to show off in the spotlight
 * We'll pick 2 of these and one activity one to highlight
 */
const createSpotlights = (stats: Stats[]): EmbedReader[] => {
  const spotlights: O.Option<EmbedReader>[] = [
    (pipe(
      most(stats)(s => s.total_exp),
      O.map (({ user, total_exp }) => 
        format('<@{0}> gained the most exp this week (**{1}** exp)')
          (user.discordId, total_exp.toFixed(1))
      ),
      O.map (field("Persistence"))
    )),

    (pipe(
      most(stats)(s => s.total_moderate),
      O.map (({ user, total_moderate }) => 
        format('<@{0}> gained the most moderate exp this week (**{1}+**)')
          (user.discordId, total_moderate.toFixed(1))
      ),
      O.map (field("Steady"))
    )),

    (pipe(
      most(stats)(s => s.total_vigorous),
      O.map(({ user, total_vigorous }) => 
        format('<@{0}> gained the most intense exp this week (**{1}++**)')
          (user.discordId, total_vigorous.toFixed(1))
      ),
      O.map (field("Explosive"))
    )),

    (pipe(
      most(stats.filter(s => s.logs.length >= 3))(s => s.deviation),
      O.map(({ user, deviation, logs }) => 
        format("<@{0}> recorded {1} activities that only varied by **{2}** exp")
          (user.discordId, logs.length, deviation.toFixed(1))
      ),
      O.map(field("Consistency"))
    )),

    (pipe(
      stats
        .filter(s => !!s.biggestActivity)
        .map(s => ({user: s.user, biggestActivity: s.biggestActivity!})),
      filtered => most(filtered)
        (s => s.biggestActivity.exp_gained),
      O.map(({ user, biggestActivity }) => 
        format("<@{0}> got the most exp in one activity with {1} (**{2}** exp)")
          (user.discordId, biggestActivity.activity_name, biggestActivity.exp_gained.toFixed(1))
      ),
      O.map(field("Biggest Activity"))
    ))
  ];

  return spotlights
    .map(O.toNullable)
    .filter((s): s is EmbedReader => !!s);
}

/**
 * Field for leader of a specific activity type.
 */
const activityLeader = (type: string, stats: Stats[]) => {
  const activityStats = stats
    .map(({ user, logs }) => {
      const l = logs.filter(log => log.activity_type === type);
      return {user, logs: l, exp: lw.sumExp(l)};
    });

  return (pipe(
    most(activityStats)(s => s.exp),
    O.map(({ user, logs, exp }) => {
      const pluralize = logs.length > 1 ? 'activities' : 'activity'; 

      return format(`<@{0}> was the {1} leader this week, with **{2}** exp from {3} ${pluralize}`)
        (user.discordId, type, exp.toFixed(1), logs.length);
    }),
    O.map(field("Workout Highlight: " + type))
  ))
}


/** Returns the element in array with the greatest `prop` value */
const most = <T>(arr: T[]) => (f: (t: T)=>number): O.Option<T> => pipe(
  arr.map (i => ({i, result: f(i)})),
  R.sort ((a, b) => a.result > b.result ? -1 : 1),
  A.head,
  O.map (result => result.i)
)

/** Calculates standard deviation */
const deviation = (nums: number[]) => pipe(
  R.mean(nums),
  avg => nums.map (n => Math.pow(n - avg, 2)),
  R.sum,
  n => n / nums.length,
  Math.sqrt
);

// Copied from here: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
const shuffle = <T>(array: T[]): T[] => {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}