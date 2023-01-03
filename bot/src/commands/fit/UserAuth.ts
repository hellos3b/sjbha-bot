import * as DiscordJs from "discord.js";
import Hapi from "@hapi/hapi";
import { assert, defaulted, string, type } from "superstruct";
import { env } from "../../environment";
import * as format from "../../deprecating/Format";

import * as User from "./User";
import * as StravaAPI from "./StravaAPI";

// The authorization data given from strava

// Strava URL for first step in OAuth flow
// you send the user here where they get prompted to "Authorize with BoredBot"
export const oauthUrl = (authToken: string) : string => {
   const params = {
      client_id:       StravaAPI.clientId (),
      redirect_uri:    env.HAPI_HOST + "/fit/accept",
      scope:           "read,activity:read_all,profile:read_all", 
      state:           authToken,
      response_type:   "code",
      approval_prompt: "force"
   };

   const query = 
    Object.entries (params)
       .map (([key, value]) => key + "=" + value)
       .join ("&");
    
   return `http://www.strava.com/oauth/authorize?${query}`;
};


// When a user wants to start using the bot with their discord account,
// they need to complete onboarding which will
// 1. DM them a link with a randomly generated "password" (auth token)
// 2. Redirect to strava, hit authorize
// 3. Save the tokens into the DB and let them know it's completed
export async function onBoarding (message: DiscordJs.Message) : Promise<void> {
   const user = await User.init (message.author.id);
   const url = oauthUrl (user.authToken);
  
   const onboarding = new format.MessageBuilder ()
      .append ("Welcome to the fitness channel!").space ()
      .append (`Click here to authorize the bot: ${url}`).space ()
      .append ("You will be asked to authorize your account with the SJBHA bot. If you do not have a strava account, you can sign up here: <https://www.strava.com>");

   message.author.send (onboarding.toString ());

   if (message.channel.type !== DiscordJs.ChannelType.DM) {
      message.reply ("Check your DMs for instructions on how to connect with strava");
   }
}

// After a user accepts on Strava's integrations hook, it will redirect us with an access code and the state we passed (auth token)
// This route will verify the auth, and then initialize the user's account with defaults
export const acceptAuthorization = (client: DiscordJs.Client) => async (req: Hapi.Request) : Promise<string> => {
   const params = req.query;

   // Validate request query
   try {
      assert (params, type ({
         code:  string (),
         state: defaulted (string (), () => "")
      }));
   }
   catch (e) {
      return "Something unexpected went wrong with the authorization. Try to get a new link and do it again";
   }

   // Make sure user exists
   const user = await User.findOne ({ authToken: params.state });

   if (!user)
      return "You need to initiate authorization with the bot before trying to connect; Use <b>!fit auth</b> in the #fitness channel";

   // Fetch the refresh token
   const auth = await StravaAPI.refreshToken (params.code);

   // Set the strava id + refresh token, plus additional defaults if user isn't set up
   await User.update ({
      // defaults
      emojis:   "people-default",
      maxHR:    undefined,
      xp:       0,
      fitScore: 0,
    
      // auth update
      ...user,
      stravaId:     auth.athlete.id,
      refreshToken: auth.refresh_token
   });

   // Send an update to the user
   const member = 
    await client.guilds
       .fetch (env.SERVER_ID)
       .then (guild => guild.members.fetch (user.discordId))
       .then (i => i, () => null);

   if (member) {
      const welcome = new format.MessageBuilder ()
         .append ("**Welcome to the #fitness channel!**")
         .append ("From now on, when you record an activity on Strava, it will be posted to the fitness channel.")
         .append ("Please note that there is a small minute delay after recording and when it posts. This is so you can edit your workout and add a title!")
         .space ()
         .append ("You will get exp for each workout you record. **If you are using a heartrate tracker** -- such as a garmin, fitbit, apple watch, or any other device -- You can get bonus exp for harder efforts. For this feature to work, set your max heartrate by sending me a message with `!fit settings`")
         .space ()
         .append ("Have fun, and make sure to hit those blob cheers!");

      member.send (welcome.toString ());
   }

   return "You have been authorized with the bot, now go workout!";
};

// When registering a strava webhook, they want you to verify the webhook URL
// by echoing back the challenge code they send you
// more information here: https://developers.strava.com/docs/webhooks/
export const acceptChallenge = async (req: Hapi.Request) : Promise<unknown> => 
   ({ "hub.challenge": req.query["hub.challenge"] });
