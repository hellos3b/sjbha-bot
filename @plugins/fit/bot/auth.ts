import * as R from "ramda";
import * as F from "fluture";
import {Request} from "@services/bastion";

import * as uc from "../user/collection";
import * as uauth from "../user";
import {debug, basePath, url_help} from "@plugins/fit/config";

const helpUrl = basePath + url_help;

/** The message that gets sent privately to a user to join the !fit command */
export const welcomeMsg = (authUrl: string) => `
  **Welcome to the fitness channel!**

  Click here to authorize the bot: ${authUrl}
  If you don't have a Strava Account: <https://www.strava.com/>
  For information on how the bot works: ${helpUrl}
`;

/** Create a message to send to users  */
export const createWelcomeMessage = R.pipe(
  uauth.getAuthLink,
  welcomeMsg
);

/** Sets up a new User */
export const auth = (req: Request) => {
  const onboarding = (privateMessage: string) => {
    req.author.send(privateMessage);
    req.reply("Hello! I've DM'd you instructions on how to connect your account")
  }
  
  // todo: Localize error handling
  const sendError = (err: any) => {
    debug("Unable to authorize user: %O", err);
    req.reply("Unable to authorize");
  };
  
  R.pipe(
    uc.getOrCreate,
    F.map (createWelcomeMessage),
    F.fork (sendError) (onboarding) 
  )(req.author.id);
}