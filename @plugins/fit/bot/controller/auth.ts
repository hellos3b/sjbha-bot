import {Request} from "@services/bastion";
import * as querystring from "querystring";

import {debug, basePath, url_login, url_help} from "@plugins/fit/config";
import {getOrInitializeUser} from "../../domain/auth/AuthRepository";


/**
 * Sets up a new User
 */
export async function auth(req: Request) {
  const user = await getOrInitializeUser(req.author.id);

  const url = basePath + url_login + "?" + querystring.stringify({
    token: user.id + "." + user.password
  })
  const helpUrl = basePath + url_help;

  // todo: update welcome command
  req.author.send(`
**Your authorization url:** ${url}

Welcome to the fitness channel! 
The bot works by listening for activities that get posted to Strava. If you don't have an account, you can sign up here: https://www.strava.com/. 

Once you accept, you'll be asked to set your max heart rate. It's optional, but you can get bonus EXP! 
For more information here: ${helpUrl}
`);
  
  req.reply("Hello! I've DM'd you instructions on how to connect your account");
}