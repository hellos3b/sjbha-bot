import { env } from "../environment";

export const channels = {
   strava: env.CHANNEL_STRAVA,
   shitpost: env.CHANNEL_SHITPOST,
   bot_admin: env.CHANNEL_BOT_ADMIN,
   meetups_directory: env.CHANNEL_MEETUPS_DIR,
   meetups: env.CHANNEL_MEETUPS,
   showdown: env.CHANNEL_THROWDOWN
};