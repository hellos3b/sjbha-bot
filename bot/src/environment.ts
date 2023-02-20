import * as z from "zod";

const envSchema = z.object ({
   CHANNEL_ADMIN: z.string (),
   CHANNEL_BOT_ADMIN: z.string (),
   CHANNEL_MEETUPS: z.string (),
   CHANNEL_MEETUPS_DIR: z.string (),
   CHANNEL_SHITPOST: z.string (),
   CHANNEL_STRAVA: z.string (),
   CHANNEL_THROWDOWN: z.string (),
   CHANNEL_BOT_LOG: z.string (),
   DISCORD_TOKEN: z.string (),
   DISCORD_CLIENT_ID: z.string (),
   HAPI_HOST: z.string (),
   HTTP_PORT: z.string (),
   MONGO_URL: z.string (),
   NODE_ENV: z.string ().default ("development"),
   SERVER_ID: z.string (),
   STRAVA_CLIENT_ID: z.string ().optional (),
   STRAVA_CLIENT_SECRET: z.string ().optional (),
   UI_HOSTNAME: z.string ()
});

export type environment = z.infer<typeof envSchema>;

export const env = envSchema.parse (process.env);