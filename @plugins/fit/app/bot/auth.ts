import * as R from "ramda";
import * as F from "fluture";
import {Request} from "@services/bastion";

import * as User from "../../models/user";
import {basePath, url_help, url_login} from "@plugins/fit/config";
import {stringify} from "querystring";
import { handleError } from "../../utils/errors";

const helpUrl = basePath + url_help;

/** Sets up a new User */
export const auth = (req: Request) => {
  const onboarding = (privateMessage: string) => {
    req.author.send(privateMessage);
    req.reply("Hello! I've DM'd you instructions on how to connect your account")
  }

  R.pipe(
    User.initializeUser,
    F.map (createWelcomeMessage),
    F.fork (handleError (req)) (onboarding) 
  )(req.author.id);
}

/** The message that gets sent privately to a user to join the !fit command */
const welcomeMsg = (authUrl: string) => `
**Welcome to the fitness channel!**

Click here to authorize the bot: ${authUrl}
If you don't have a Strava Account: <https://www.strava.com/>
For information on how the bot works: ${helpUrl}
`;

const authLink = (token: string) => basePath + url_login + "?" + stringify({token});

/** Create a message to send to users  */
const createWelcomeMessage = R.pipe(
  User.toToken,
  authLink, 
  welcomeMsg
);