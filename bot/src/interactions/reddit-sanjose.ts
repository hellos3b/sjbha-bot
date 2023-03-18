import * as Hapi from "@hapi/hapi";
import * as Boom from "@hapi/boom";
import * as D from "discord.js";
import * as z from "zod";
import { env } from "../environment";

const reddit_icon = "https://imgur.com/DMxh8yy.png";

const reqSchema = z.object ({
   title: z.string (),
   url: z.string (),
   author: z.string (),
   secret: z.string ()
});

type schema = z.infer<typeof reqSchema>

const render = (s: schema): D.MessageOptions => ({
   embeds: [{
      color: 0xff4500,
      author: {
         icon_url: reddit_icon,
         name: s.author,
         url: s.url
      }
   }]
});

export const webhook = (client: D.Client): Hapi.ServerRoute => ({
   method: "POST",
   path: "/reddit-webhook",
   handler: async req => {
      const body = reqSchema.parse (req.payload);
      if (body.secret !== env.REDDIT_SECRET) throw Boom.unauthorized ();
      
      const shitpost = await client.channels.fetch (env.CHANNEL_SHITPOST);
      shitpost?.isTextBased () && shitpost.send (render (body));
      return "Done";
   }
});