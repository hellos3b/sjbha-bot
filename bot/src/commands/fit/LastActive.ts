import { Client, Message } from "discord.js";
import schedule from "node-schedule";
import * as User from "./User";

const activity = new Map<string, string> ();

export const updateActivity = (msg: Message): void => {
   activity.set (msg.author.id, msg.createdAt.toISOString ());
};

const flush = async () => {
   const users = await User.find ({});
   const authed = users.filter (User.isAuthorized);

   for (const user of authed) {
      const timestamp = activity.get (user.discordId);
      if (!timestamp) continue;
      await User.update ({ ...user, lastActive: timestamp });
   }

   activity.clear ();
};

/** Update the last activity of a user, so we don't post workouts from inactive users */
export const beginFlush = (client: Client): void => {
   client.on ("messageCreate", updateActivity);
   schedule.scheduleJob ("0 */6 * * *", flush);
};