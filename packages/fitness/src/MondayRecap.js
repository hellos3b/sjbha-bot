import { startOfWeek } from "date-fns";
import { EmbedBuilder } from "discord.js";
import schedule from "node-schedule";
import { loggedWorkoutCollection } from "./LoggedWorkout";
import { effortScore } from "./EffortScore";

const unique = (arr) => Array.from(new Set(arr));
const notNull = (x) => !!x;

/**
 * @param {import("discord.js").Client} discord
 * @param {import("mongodb").Db} db
 */
export const createRecap = (discord, db) => async () => {
   const workouts = loggedWorkoutCollection(db);
   const monday = startOfWeek(new Date(), { weekStartsOn: 1 });

   const workoutsThisWeek = await workouts
      .find({ insertedDate: { $gt: monday.toISOString() } })
      .toArray();

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
         "Here's everyone's total 💦 score from the last week!\n\n" +
         members
            .filter((m) => workoutsThisWeek.some((x) => x.discordId === m.id))
            .map((member) => {
               const exp = workoutsThisWeek
                  .filter((x) => x.discordId === member.id)
                  .reduce((sum, a) => sum + a.exp, 0);

               return {
                  username: member.nickname ?? member.user.username,
                  score: effortScore(exp),
               };
            })
            .filter(notNull)
            .sort((a, b) => (a.score > b.score ? -1 : 1))
            .map((x) => `🔹 **${x.username}** ${x.score.toFixed(1)}`)
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
