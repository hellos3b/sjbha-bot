import * as z from "zod";

const env = z.object ({
   npm_package_version: z.string (),
   CHANNEL_ADMIN: z.string (),
   CHANNEL_BOT_ADMIN: z.string (),
   CHANNEL_SHITPOST: z.string (),
   CHANNEL_BOT_LOG: z.string (),
   DISCORD_TOKEN: z.string (),
   DISCORD_CLIENT_ID: z.string (),
   HTTP_PORT: z.string (),
   MONGO_URL: z.string (),
   NODE_ENVIRONMENT: z.string ().default ("development"),
   SERVER_ID: z.string ()
});

type env = z.infer<typeof env>;

declare global {
   namespace NodeJS {
      // eslint-disable-next-line @typescript-eslint/no-empty-interface
      interface ProcessEnv extends env {}
   }
}

export const assertValid = (): void => {
   env.parse (process.env);
};