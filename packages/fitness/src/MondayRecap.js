import { startOfWeek, subDays, subWeeks } from "date-fns";
import { EmbedBuilder } from "discord.js";
import schedule from "node-schedule";
import { loggedWorkoutCollection } from "./LoggedWorkout";
import { effortScore } from "./EffortScore";

const unique = (arr) => Array.from(new Set(arr));
const notNull = (x) => !!x;
const add = (a, b) => a + b;
const average = (nums) =>
   nums.length === 0 ? 0 : nums.reduce(add, 0) / nums.length;

// Returns how much a user gets per week on average.
// returns -1 if not enough data
const expByWeek = (workouts) =>
   Object.values(
      workouts.reduce((dict, workout) => {
         const inserted = new Date(workout.insertedDate);
         const monday = startOfWeek(inserted, {
            weekStartsOn: 1,
         }).toISOString();

         dict[monday] = (dict[monday] ?? 0) + workout.exp;
         return dict;
      }, {}),
   );

const Streak = {
   NOOB: 0,
   CONSISTENT: 1,
   HOT: 2,
   COLD: 3,
};

const streakToString = (streak) =>
   ({
      [Streak.COLD]: "❄️",
      [Streak.CONSISTENT]: "",
      [Streak.HOT]: "🔥",
      [Streak.NOOB]: "👋",
   })[streak];

const getStreak = (weeklyExp, exp) => {
   if (!weeklyExp.length) return Streak.NOOB;
   if (weeklyExp.length < 3) return Streak.CONSISTENT;

   const avg = average(weeklyExp);
   if (exp < avg * 0.6) return Streak.COLD;
   if (exp > avg * 1.4) return Streak.HOT;
   return Streak.CONSISTENT;
};

// const

/**
 * @param {import("discord.js").Client} discord
 * @param {import("mongodb").Db} db
 */
export const createRecap = (discord, db) => async () => {
   const workouts = loggedWorkoutCollection(db);
   const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
   const lastMonday = subDays(thisMonday, 7);

   const recentWorkouts = await workouts
      .find({
         insertedDate: {
            $gt: subWeeks(thisMonday, 7).toISOString(),
            $lt: thisMonday.toISOString(),
         },
      })
      .toArray();

   const workoutsThisWeek = recentWorkouts.filter(
      (x) => x.insertedDate >= lastMonday.toISOString(),
   );

   const workoutsBeforeThisWeek = recentWorkouts.filter(
      (x) => x.insertedDate < lastMonday.toISOString(),
   );

   const discordIds = unique(workoutsThisWeek.map((x) => x.discordId));

   const guild = await discord.guilds.fetch(process.env.SERVER_ID);
   const members = await guild.members.fetch(discordIds);
   await guild.members.fetch(discordIds);

   return new EmbedBuilder({
      color: 0x4287f5,
      author: {
         icon_url: "https://imgur.com/iRWWVZY.png",
         name: "Monday Moist Recap",
      },
      description:
         "Here's everyone's total score from the previous week!\n\n" +
         "💦💦💦\n\n" +
         members
            .filter((m) => workoutsThisWeek.some((x) => x.discordId === m.id))
            .map((member) => {
               const workouts = workoutsThisWeek.filter(
                  (x) => x.discordId === member.id,
               );

               const exp = workouts.reduce((sum, a) => sum + a.exp, 0);
               const prevWeekExps = expByWeek(
                  workoutsBeforeThisWeek.filter(
                     (x) => x.discordId === member.id,
                  ),
               );

               return {
                  username: member.nickname ?? member.user.username,
                  count: workouts.length,
                  score: effortScore(exp),
                  streak: getStreak(prevWeekExps, exp),
               };
            })
            .filter(notNull)
            .sort((a, b) => (a.score > b.score ? -1 : 1))
            .map((x) => {
               return `**${x.username}**🔹${x.score.toFixed(1)} (${x.count}) ${streakToString(x.streak)}`;
            })
            .join("\n"),
   });
};

export const schedulePost = async (discord, db) => {
   const create = createRecap(discord, db);

   const post = async () => {
      const embed = await create();
      const channel = await discord.channels.fetch(process.env.CHANNEL_STRAVA);
      await channel.send({ embeds: [embed] });
   };

   schedule.scheduleJob("0 9 * * MON", () => post());
};
